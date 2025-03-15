import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';

/**
 * Tauri文件系统适配器
 * 提供与Tauri API交互的文件操作方法
 */
export const tauriFs = {
  /**
   * 保存文件到本地
   * @param content 文件内容
   * @param fileName 默认文件名
   * @param fileExtension 文件扩展名
   */
  async saveFile(content: string, fileName = 'content', fileExtension = 'md') {
    try {
      // 使用新的 API
      const filePath = await save({
        defaultPath: `${fileName}.${fileExtension}`,
        filters: [{
          name: fileExtension.toUpperCase(),
          extensions: [fileExtension]
        }]
      });
      
      if (filePath) {
        // 写入文件内容
        await writeTextFile(filePath, content);
        return { success: true, path: filePath };
      }
      return { success: false, message: '用户取消了保存操作' };
    } catch (error) {
      console.error('保存文件失败:', error);
      return { success: false, message: `保存文件失败: ${error}` };
    }
  },

  /**
   * 从本地打开文件
   * @param fileExtensions 允许的文件扩展名数组
   */
  async openFile(fileExtensions = ['md']) {
    try {
      // 使用新的 API
      const selected = await open({
        multiple: false,
        filters: [{
          name: '文档',
          extensions: fileExtensions
        }]
      });
      
      if (selected && typeof selected === 'string') {
        // 读取文件内容
        const content = await readTextFile(selected);
        return { success: true, content, path: selected };
      }
      return { success: false, message: '用户取消了打开操作' };
    } catch (error) {
      console.error('打开文件失败:', error);
      return { success: false, message: `打开文件失败: ${error}` };
    }
  },

  /**
   * 导出HTML内容到文件
   * @param htmlContent HTML内容
   * @param fileName 默认文件名
   */
  async exportHtml(htmlContent: string, fileName = 'content') {
    return this.saveFile(
      `<html><head><meta charset="utf-8" /></head><body><div style="width: 750px; margin: auto;">${htmlContent}</div></body></html>`,
      fileName,
      'html'
    );
  },

  /**
   * 导出Markdown内容到文件
   * @param markdownContent Markdown内容
   * @param fileName 默认文件名
   */
  async exportMarkdown(markdownContent: string, fileName = 'content') {
    return this.saveFile(markdownContent, fileName, 'md');
  }
};

export default tauriFs;