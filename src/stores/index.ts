import type { ReadTimeResults } from 'reading-time'
import DEFAULT_CONTENT from '@/assets/example/markdown.md?raw'
import DEFAULT_CSS_CONTENT from '@/assets/example/theme-css.txt?raw'
import { altKey, codeBlockThemeOptions, colorOptions, fontFamilyOptions, fontSizeOptions, legendOptions, shiftKey, themeMap, themeOptions } from '@/config'
import { addPrefix, css2json, customCssWithTemplate, customizeTheme, extractWithRegex, formatDoc } from '@/utils'
import { initRenderer } from '@/utils/renderer'

import { tauriFs } from '@/utils/tauri-fs'
import CodeMirror from 'codemirror'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

// 目录类型定义
interface Directory {
  id: string
  name: string
  parentId: string | null
  isExpanded: boolean
  children: string[]
}

// 文档与目录关系映射的类型定义
interface PostDirectoryMap {
  [key: string]: string
}

export const useStore = defineStore(`store`, () => {
  // 是否开启深色模式
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  // 是否开启 Mac 代码块
  const isMacCodeBlock = useStorage(`isMacCodeBlock`, true)
  const toggleMacCodeBlock = useToggle(isMacCodeBlock)

  // 是否在左侧编辑
  const isEditOnLeft = useStorage(`isEditOnLeft`, true)
  const toggleEditOnLeft = useToggle(isEditOnLeft)

  // 是否开启微信外链接底部引用
  const isCiteStatus = useStorage(`isCiteStatus`, false)
  const toggleCiteStatus = useToggle(isCiteStatus)

  // 是否统计字数和阅读时间
  const isCountStatus = useStorage(`isCountStatus`, false)
  const toggleCountStatus = useToggle(isCountStatus)

  // 是否开启段落首行缩进
  const isUseIndent = useStorage(addPrefix(`use_indent`), false)
  const toggleUseIndent = useToggle(isUseIndent)

  const output = ref(``)

  // 文本字体
  const theme = useStorage<keyof typeof themeMap>(addPrefix(`theme`), themeOptions[0].value)
  // 文本字体
  const fontFamily = useStorage(`fonts`, fontFamilyOptions[0].value)
  // 文本大小
  const fontSize = useStorage(`size`, fontSizeOptions[2].value)
  // 主色
  const primaryColor = useStorage(`color`, colorOptions[0].value)
  // 代码块主题
  const codeBlockTheme = useStorage(`codeBlockTheme`, codeBlockThemeOptions[23].value)
  // 图注格式
  const legend = useStorage(`legend`, legendOptions[3].value)

  const fontSizeNumber = computed(() => Number(fontSize.value.replace(`px`, ``)))

  // 内容编辑器编辑器
  const editor = ref<CodeMirror.EditorFromTextArea | null>(null)
  // 编辑区域内容
  // 预备弃用
  const editorContent = useStorage(`__editor_content`, DEFAULT_CONTENT)

  const isOpenRightSlider = useStorage(addPrefix(`is_open_right_slider`), false)

  const isOpenPostSlider = useStorage(addPrefix(`is_open_post_slider`), false)

  // Directory structure
  const directories = useStorage<Directory[]>(addPrefix(`directories`), [
    {
      id: `root`,
      name: `根目录`,
      parentId: null,
      isExpanded: true,
      children: [],
    },
  ])

  // 文档与目录关联
  const postDirectoryMap = useStorage<PostDirectoryMap>(addPrefix(`post_directory_map`), {})

  // 内容列表
  const posts = useStorage(addPrefix(`posts`), [{
    title: `Markdown 快速指南`,
    content: DEFAULT_CONTENT,
  }])
  // 当前内容
  const currentPostIndex = useStorage(addPrefix(`current_post_index`), 0)

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  // 查找目录路径
  const findDirectoryPath = (directoryId: string) => {
    const path: string[] = []

    const traverse = (id: string): boolean => {
      if (id === `root`) {
        path.unshift(`根目录`)
        return true
      }

      const dir = directories.value.find(d => d.id === id)
      if (dir) {
        path.unshift(dir.name)
        return dir.parentId === null ? true : traverse(dir.parentId)
      }

      return false
    }

    traverse(directoryId)
    return path
  }

  // 确保兼容性处理 - 初始化时将所有未分类文档放入根目录
  onMounted(() => {
    // 迁移阶段，兼容之前的方案
    if (editorContent.value !== DEFAULT_CONTENT) {
      posts.value[currentPostIndex.value].content = editorContent.value
      editorContent.value = DEFAULT_CONTENT
    }

    // 为所有未分类的文档分配根目录
    posts.value.forEach((post, index) => {
      if (!postDirectoryMap.value[index]) {
        postDirectoryMap.value[index] = `root`
      }
    })
  })

  // 添加目录
  const addDirectory = (name: string, parentId: string = `root`) => {
    const id = generateId()
    directories.value.push({
      id,
      name,
      parentId,
      isExpanded: false,
      children: [],
    })

    // 更新父目录的children数组
    if (parentId !== null) {
      const parent = directories.value.find(d => d.id === parentId)
      if (parent) {
        parent.children.push(id)
      }
    }

    return id
  }

  // 重命名目录
  const renameDirectory = (id: string, newName: string) => {
    const dir = directories.value.find(d => d.id === id)
    if (dir) {
      dir.name = newName
    }
  }

  // 删除目录和其子目录
  const deleteDirectory = (id: string, shouldDeleteDocuments: boolean = false): void => {
    // 先找到这个目录
    const dir = directories.value.find(d => d.id === id)
    if (!dir)
      return

    // 收集要删除的所有目录ID（包括子目录）
    const idsToDelete: string[] = []

    const collectIds = (dirId: string): void => {
      idsToDelete.push(dirId)

      const dir = directories.value.find(d => d.id === dirId)
      if (dir && dir.children.length > 0) {
        dir.children.forEach(childId => collectIds(childId))
      }
    }

    collectIds(id)

    if (shouldDeleteDocuments) {
      // 删除该目录下的所有文档
      const entriesToDelete: number[] = []

      // 找出要删除的文档索引
      Object.entries(postDirectoryMap.value).forEach(([postIndex, dirId]) => {
        if (idsToDelete.includes(dirId)) {
          entriesToDelete.push(Number(postIndex))
        }
      })

      // 按索引从大到小排序，以避免删除时索引变化
      entriesToDelete.sort((a, b) => b - a)

      // 删除文档
      for (const index of entriesToDelete) {
        posts.value.splice(index, 1)
        delete postDirectoryMap.value[index]

        // 更新大于删除索引的映射关系
        Object.keys(postDirectoryMap.value).forEach((key) => {
          const postIndex = Number(key)
          if (postIndex > index) {
            postDirectoryMap.value[String(postIndex - 1)] = postDirectoryMap.value[String(postIndex)]
            delete postDirectoryMap.value[String(postIndex)]
          }
        })
      }

      // 如果当前选中的文档被删除，重置索引
      if (currentPostIndex.value >= posts.value.length) {
        currentPostIndex.value = Math.max(0, posts.value.length - 1)
      }
    }
    else {
      // 将该目录下的所有文档移到根目录
      Object.entries(postDirectoryMap.value).forEach(([postIndex, dirId]) => {
        if (idsToDelete.includes(dirId)) {
          postDirectoryMap.value[postIndex] = `root`
        }
      })
    }

    // 从父目录的children列表中移除
    if (dir.parentId !== null) {
      const parent = directories.value.find(d => d.id === dir.parentId)
      if (parent) {
        const index = parent.children.indexOf(id)
        if (index !== -1) {
          parent.children.splice(index, 1)
        }
      }
    }

    // 从directories数组中删除这些目录
    directories.value = directories.value.filter(d => !idsToDelete.includes(d.id))
  }

  // 切换目录的展开/折叠状态
  const toggleDirectoryExpanded = (id: string) => {
    const dir = directories.value.find(d => d.id === id)
    if (dir) {
      dir.isExpanded = !dir.isExpanded
    }
  }

  // 移动项目（可以是目录或文档）
  const moveItem = (itemId: string, targetDirId: string, isDirectory: boolean = false): boolean => {
    if (isDirectory) {
      // 不允许将目录移动到自己或自己的子目录中
      const dir = directories.value.find(d => d.id === itemId)
      if (!dir)
        return false

      // 检查是否是移到自己或自己的子目录
      const checkIsSelfOrChild = (dirId: string): boolean => {
        if (dirId === itemId)
          return true

        const dir = directories.value.find(d => d.id === dirId)
        if (!dir)
          return false

        return dir.parentId !== null ? checkIsSelfOrChild(dir.parentId) : false
      }

      if (checkIsSelfOrChild(targetDirId))
        return false

      // 先从原来的父目录中移除
      if (dir.parentId !== null) {
        const oldParent = directories.value.find(d => d.id === dir.parentId)
        if (oldParent) {
          const index = oldParent.children.indexOf(itemId)
          if (index !== -1) {
            oldParent.children.splice(index, 1)
          }
        }
      }

      // 添加到新的父目录
      const newParent = directories.value.find(d => d.id === targetDirId)
      if (newParent) {
        newParent.children.push(itemId)
        dir.parentId = targetDirId
      }
    }
    else {
      // 移动文档
      postDirectoryMap.value[itemId] = targetDirId
    }

    return true
  }

  const addPost = (title: string, directoryId: string = `root`, content?: string) => {
    console.log(`[Store] Adding post with title: ${title} to directory: ${directoryId}`)

    currentPostIndex.value = posts.value.push({
      title,
      content: content || `# ${title}`,
    }) - 1

    // 添加目录关联
    postDirectoryMap.value[currentPostIndex.value] = directoryId
    console.log(`[Store] Added post at index ${currentPostIndex.value}, post directory map:`, postDirectoryMap.value)
  }

  const renamePost = (index: number, title: string) => {
    posts.value[index].title = title
  }

  const delPost = (index: number) => {
    posts.value.splice(index, 1)
    currentPostIndex.value = Math.min(index, posts.value.length - 1)

    // 更新目录映射关系
    delete postDirectoryMap.value[index]

    // 更新大于删除索引的映射关系
    Object.keys(postDirectoryMap.value).forEach((key) => {
      const postIndex = Number(key)
      if (postIndex > index) {
        postDirectoryMap.value[postIndex - 1] = postDirectoryMap.value[postIndex]
        delete postDirectoryMap.value[postIndex]
      }
    })
  }

  watch(currentPostIndex, () => {
    toRaw(editor.value!).setValue(posts.value[currentPostIndex.value].content)
  })

  // 格式化文档
  const formatContent = () => {
    formatDoc((editor.value!).getValue()).then((doc) => {
      posts.value[currentPostIndex.value].content = doc
      toRaw(editor.value!).setValue(doc)
    })
  }

  // 切换 highlight.js 代码主题
  const codeThemeChange = () => {
    const cssUrl = codeBlockTheme.value
    const el = document.querySelector(`#hljs`)
    if (el) {
      el.setAttribute(`href`, cssUrl)
    }
    else {
      const link = document.createElement(`link`)
      link.setAttribute(`type`, `text/css`)
      link.setAttribute(`rel`, `stylesheet`)
      link.setAttribute(`href`, cssUrl)
      link.setAttribute(`id`, `hljs`)
      document.head.appendChild(link)
    }
  }

  // 自义定 CSS 编辑器
  const cssEditor = ref<CodeMirror.EditorFromTextArea | null>(null)
  const setCssEditorValue = (content: string) => {
    (cssEditor.value!).setValue(content)
  }
  // 自定义 CSS 内容
  const cssContent = useStorage(`__css_content`, DEFAULT_CSS_CONTENT)
  const cssContentConfig = useStorage(addPrefix(`css_content_config`), {
    active: `方案1`,
    tabs: [
      {
        title: `方案1`,
        name: `方案1`,
        // 兼容之前的方案
        content: cssContent.value || DEFAULT_CSS_CONTENT,
      },
    ],
  })
  onMounted(() => {
    // 清空过往历史记录
    cssContent.value = ``
  })
  const getCurrentTab = () => cssContentConfig.value.tabs.find((tab) => {
    return tab.name === cssContentConfig.value.active
  })!
  const tabChanged = (name: string) => {
    cssContentConfig.value.active = name
    const content = cssContentConfig.value.tabs.find((tab) => {
      return tab.name === name
    })!.content
    setCssEditorValue(content)
  }

  // 重命名 css 方案
  const renameTab = (name: string) => {
    const tab = getCurrentTab()!
    tab.title = name
    tab.name = name
    cssContentConfig.value.active = name
  }

  const addCssContentTab = (name: string) => {
    cssContentConfig.value.tabs.push({
      name,
      title: name,
      content: DEFAULT_CSS_CONTENT,
    })
    cssContentConfig.value.active = name
    setCssEditorValue(DEFAULT_CSS_CONTENT)
  }
  const validatorTabName = (val: string) => {
    return cssContentConfig.value.tabs.every(({ name }) => name !== val)
  }

  const renderer = initRenderer({
    theme: customCssWithTemplate(css2json(getCurrentTab().content), primaryColor.value, customizeTheme(themeMap[theme.value], { fontSize: fontSizeNumber.value, color: primaryColor.value })),
    fonts: fontFamily.value,
    size: fontSize.value,
    isUseIndent: isUseIndent.value,
  })

  const readingTime = ref<ReadTimeResults | null>(null)

  // 更新编辑器
  const editorRefresh = () => {
    codeThemeChange()
    renderer.reset({ citeStatus: isCiteStatus.value, legend: legend.value, isUseIndent: isUseIndent.value, countStatus: isCountStatus.value })

    // Ensure editor exists before using it
    if (!editor.value) {
      console.warn('Editor not initialized yet - rendering default content instead')
      
      // Render the default content as a fallback
      const { markdownContent, readingTime: readingTimeResult } = renderer.parseFrontMatterAndContent(posts.value[currentPostIndex.value].content)
      readingTime.value = readingTimeResult
      let outputTemp = marked.parse(markdownContent) as string
      outputTemp = DOMPurify.sanitize(outputTemp)

      // 阅读时间及字数统计
      outputTemp = renderer.buildReadingTime(readingTimeResult) + outputTemp

      // 去除第一行的 margin-top
      outputTemp = outputTemp.replace(/(style=".*?)"/, `$1;margin-top: 0"`)
      // 引用脚注
      outputTemp += renderer.buildFootnotes()
      // 附加的一些 style
      outputTemp += renderer.buildAddition()

      if (isMacCodeBlock.value) {
        outputTemp += `
          <style>
            .hljs.code__pre > .mac-sign {
              display: flex;
            }
          </style>
        `
      }

      outputTemp += `
        <style>
          .code__pre {
            padding: 0 !important;
          }

          .hljs.code__pre code {
            display: -webkit-box;
            padding: 0.5em 1em 1em;
            overflow-x: auto;
            text-indent: 0;
          }
        </style>
      `

      output.value = renderer.createContainer(outputTemp)
      return
    }

    const { markdownContent, readingTime: readingTimeResult } = renderer.parseFrontMatterAndContent(editor.value.getValue())
    readingTime.value = readingTimeResult
    let outputTemp = marked.parse(markdownContent) as string
    outputTemp = DOMPurify.sanitize(outputTemp)

    // 阅读时间及字数统计
    outputTemp = renderer.buildReadingTime(readingTimeResult) + outputTemp

    // 去除第一行的 margin-top
    outputTemp = outputTemp.replace(/(style=".*?)"/, `$1;margin-top: 0"`)
    // 引用脚注
    outputTemp += renderer.buildFootnotes()
    // 附加的一些 style
    outputTemp += renderer.buildAddition()

    if (isMacCodeBlock.value) {
      outputTemp += `
        <style>
          .hljs.code__pre > .mac-sign {
            display: flex;
          }
        </style>
      `
    }

    outputTemp += `
      <style>
        .code__pre {
          padding: 0 !important;
        }

        .hljs.code__pre code {
          display: -webkit-box;
          padding: 0.5em 1em 1em;
          overflow-x: auto;
          text-indent: 0;
        }
      </style>
    `

    output.value = renderer.createContainer(outputTemp)
  }

  // 更新 CSS
  const updateCss = () => {
    const json = css2json(cssEditor.value!.getValue())
    const newTheme = customCssWithTemplate(json, primaryColor.value, customizeTheme(themeMap[theme.value], { fontSize: fontSizeNumber.value, color: primaryColor.value }))
    renderer.setOptions({
      theme: newTheme,
    })

    editorRefresh()
  }
  // 初始化 CSS 编辑器
  onMounted(() => {
    const cssEditorDom = document.querySelector<HTMLTextAreaElement>(`#cssEditor`)!
    cssEditorDom.value = getCurrentTab().content
    const theme = isDark.value ? `darcula` : `xq-light`
    cssEditor.value = markRaw(
      CodeMirror.fromTextArea(cssEditorDom, {
        mode: `css`,
        theme,
        lineNumbers: false,
        lineWrapping: true,
        styleActiveLine: true,
        matchBrackets: true,
        autofocus: true,
        extraKeys: {
          [`${shiftKey}-${altKey}-F`]: function autoFormat(editor: CodeMirror.Editor) {
            formatDoc(editor.getValue(), `css`).then((doc) => {
              getCurrentTab().content = doc
              editor.setValue(doc)
            })
          },
        },
      } as never),
    )

    // 自动提示
    cssEditor.value.on(`keyup`, (cm, e) => {
      if ((e.keyCode >= 65 && e.keyCode <= 90) || e.keyCode === 189) {
        (cm as any).showHint(e)
      }
    })

    // 实时保存
    cssEditor.value.on(`update`, () => {
      updateCss()
      getCurrentTab().content = cssEditor.value!.getValue()
    })
  })

  watch(isDark, () => {
    const theme = isDark.value ? `darcula` : `xq-light`
    toRaw(cssEditor.value)?.setOption?.(`theme`, theme)
  })

  // 重置样式
  const resetStyle = () => {
    isCiteStatus.value = false
    isMacCodeBlock.value = true
    isCountStatus.value = false

    theme.value = themeOptions[0].value
    fontFamily.value = fontFamilyOptions[0].value
    fontFamily.value = fontFamilyOptions[0].value
    fontSize.value = fontSizeOptions[2].value
    primaryColor.value = colorOptions[0].value
    codeBlockTheme.value = codeBlockThemeOptions[23].value
    legend.value = legendOptions[3].value

    cssContentConfig.value = {
      active: `方案 1`,
      tabs: [
        {
          title: `方案 1`,
          name: `方案 1`,
          // 兼容之前的方案
          content: cssContent.value || DEFAULT_CSS_CONTENT,
        },
      ],
    }

    cssEditor.value!.setValue(DEFAULT_CSS_CONTENT)

    updateCss()
    editorRefresh()

    toast.success(`样式重置成功~`)
  }

  // 为函数添加刷新编辑器的功能
  const withAfterRefresh = (fn: (...rest: any[]) => void) => (...rest: any[]) => {
    fn(...rest)
    editorRefresh()
  }

  const getTheme = (size: string, color: string) => {
    const newTheme = themeMap[theme.value]
    const fontSize = Number(size.replace(`px`, ``))
    return customCssWithTemplate(css2json(getCurrentTab().content), color, customizeTheme(newTheme, { fontSize, color }))
  }

  const themeChanged = withAfterRefresh((newTheme: keyof typeof themeMap) => {
    renderer.setOptions({
      theme: customCssWithTemplate(css2json(getCurrentTab().content), primaryColor.value, customizeTheme(themeMap[newTheme], { fontSize: fontSizeNumber.value })),
    })
    theme.value = newTheme
  })

  const fontChanged = withAfterRefresh((fonts) => {
    renderer.setOptions({
      fonts,
    })

    fontFamily.value = fonts
  })

  const sizeChanged = withAfterRefresh((size) => {
    const theme = getTheme(size, primaryColor.value)
    renderer.setOptions({
      size,
      theme,
    })

    fontSize.value = size
  })

  const colorChanged = withAfterRefresh((newColor) => {
    const theme = getTheme(fontSize.value, newColor)
    renderer.setOptions({
      theme,
    })

    primaryColor.value = newColor
  })

  const codeBlockThemeChanged = withAfterRefresh((newTheme) => {
    codeBlockTheme.value = newTheme
  })

  const legendChanged = withAfterRefresh((newVal) => {
    legend.value = newVal
  })

  const macCodeBlockChanged = withAfterRefresh(() => {
    toggleMacCodeBlock()
  })

  const citeStatusChanged = withAfterRefresh(() => {
    toggleCiteStatus()
  })

  const countStatusChanged = withAfterRefresh(() => {
    toggleCountStatus()
  })

  const useIndentChanged = withAfterRefresh(() => {
    toggleUseIndent()
  })

  // 导出 HTML 文档
  const exportEditorContent2HTML = async () => {
    try {
      const element = document.querySelector(`#output`)!

      // 使用内联的setStyles函数
      function setStyles(element: Element) {
        function getElementStyles(element: Element, excludes = [`width`, `height`, `inlineSize`, `webkitLogicalWidth`, `webkitLogicalHeight`]) {
          const styles = getComputedStyle(element, null)
          return Object.entries(styles)
            .filter(
              ([key]) => {
                const kebabKey = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
                return styles.getPropertyValue(kebabKey) && !excludes.includes(key)
              },
            )
            .map(([key, value]) => {
              const kebabKey = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
              return `${kebabKey}:${value};`
            })
            .join(``)
        }

        function isPre(element: Element) {
          return (
            element.tagName === `PRE`
            && Array.from(element.classList).includes(`code__pre`)
          )
        }

        function isCode(element: Element | null) {
          return (
            element?.tagName === `CODE`
            && element?.parentElement?.tagName === `PRE`
            && Array.from(element?.parentElement?.classList || []).includes(`code__pre`)
          )
        }

        function isSpan(element: Element) {
          return (
            element.tagName === `SPAN`
            && element.parentElement?.tagName === `CODE`
            && element.parentElement?.parentElement?.tagName === `PRE`
          )
        }

        switch (true) {
          case isPre(element):
          case isCode(element):
          case isSpan(element):
            element.setAttribute(`style`, getElementStyles(element))
        }
        if (element.children.length) {
          Array.from(element.children).forEach(child => setStyles(child))
        }
      }

      setStyles(element)

      const htmlStr = element.innerHTML
        .replace(/var\(--md-primary-color\)/g, primaryColor.value)
        .replace(/--md-primary-color:.+?;/g, ``)

      const result = await tauriFs.exportHtml(htmlStr)
      if (result.success) {
        toast.success(`导出HTML文档成功`)
      }
      else {
        toast.error(result.message || `导出失败`)
      }
    }
    catch (error) {
      toast.error(`导出失败: ${error}`)
    }
  }

  // 导出 Markdown 文档
  const exportEditorContent2MD = async () => {
    try {
      const result = await tauriFs.exportMarkdown(posts.value[currentPostIndex.value].content, posts.value[currentPostIndex.value].title)
      if (result.success) {
        toast.success(`导出Markdown文档成功`)
      }
      else {
        toast.error(result.message || `导出失败`)
      }
    }
    catch (error) {
      toast.error(`导出失败: ${error}`)
    }
  }

  // 导入 Markdown 文档
  const importMarkdownContent = async (isRightImport?: boolean) => {
    try {
      const result = await tauriFs.openFile([`md`])
      if (result.success && result.content) {
        // feat: 右键菜单导入MD到已选择内容中
        if (isRightImport) {
          posts.value[currentPostIndex.value].content = result.content
          toRaw(editor.value!).setValue(result.content)
          toast.success(`导入Markdown文档成功`)
          return
        }
        const importName = extractWithRegex(result.path)
        if (!posts.value.some(post => post.title === importName)) {
          addPost(importName, `root`, result.content)
          toast.success(`导入Markdown文档成功`)
        }
        else {
          toast.error(`导入文件已存在`)
        }

        // addPost(importName, `root`, result.content)
        // posts.value.push({
        //   title: extractWithRegex(result.path),
        //   content: result.content,
        // })

        // posts.value[currentPostIndex.value].content = result.content
        // toRaw(editor.value!).setValue(result.content)
        // toast.success(`导入Markdown文档成功`)
      }
      else if (!result.success) {
        toast.error(result.message || `导入失败`)
      }
    }
    catch (error) {
      toast.error(`导入失败: ${error}`)
    }
  }

  const isOpenConfirmDialog = ref(false)

  // 重置样式
  const resetStyleConfirm = () => {
    isOpenConfirmDialog.value = true
  }

  return {
    isDark,
    toggleDark,

    isEditOnLeft,
    toggleEditOnLeft,

    isMacCodeBlock,
    isCiteStatus,
    citeStatusChanged,
    isUseIndent,
    useIndentChanged,

    isCountStatus,
    countStatusChanged,

    output,
    editor,
    cssEditor,
    theme,
    fontFamily,
    fontSize,
    primaryColor,
    codeBlockTheme,
    legend,
    readingTime,

    editorRefresh,

    themeChanged,
    fontChanged,
    sizeChanged,
    colorChanged,
    codeBlockThemeChanged,
    legendChanged,
    macCodeBlockChanged,

    formatContent,
    exportEditorContent2HTML,
    exportEditorContent2MD,

    importMarkdownContent,

    isOpenConfirmDialog,
    resetStyleConfirm,
    resetStyle,

    cssContentConfig,
    addCssContentTab,
    validatorTabName,
    setCssEditorValue,
    tabChanged,
    renameTab,
    posts,
    currentPostIndex,
    addPost,
    renamePost,
    delPost,
    isOpenPostSlider,
    isOpenRightSlider,

    // 新增的目录相关方法
    directories,
    postDirectoryMap,
    addDirectory,
    renameDirectory,
    deleteDirectory,
    toggleDirectoryExpanded,
    moveItem,
    findDirectoryPath,
  }
})

export const useDisplayStore = defineStore(`display`, () => {
  // 是否展示 CSS 编辑器
  const isShowCssEditor = ref(false)
  const toggleShowCssEditor = useToggle(isShowCssEditor)

  // 是否展示插入表格对话框
  const isShowInsertFormDialog = ref(false)
  const toggleShowInsertFormDialog = useToggle(isShowInsertFormDialog)

  // 是否展示上传图片对话框
  const isShowUploadImgDialog = ref(false)
  const toggleShowUploadImgDialog = useToggle(isShowUploadImgDialog)

  return {
    isShowCssEditor,
    toggleShowCssEditor,
    isShowInsertFormDialog,
    toggleShowInsertFormDialog,
    isShowUploadImgDialog,
    toggleShowUploadImgDialog,
  }
})
