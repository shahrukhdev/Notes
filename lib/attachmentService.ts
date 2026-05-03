import api from "./api";

export const fetchAttachments = async (noteId: string) => {

    const response = await api.get(`/notes/${noteId}/attachments`);

    return response.data;
};

export const uploadAttachment = async (noteId: string, formData: FormData) => {

    const response = await api.post(`/notes/${noteId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data
};

export const downloadAttachment = async (attachmentId: string, fileName: string) => {
  const response = await api.get(`/attachments/${attachmentId}/download`, {
    responseType: "blob",
  });

  // Create a temporary link and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName); // uses original filename
  document.body.appendChild(link);
  link.click();

  // Cleanup
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteAttachment = async (noteId: string, attachmentId: string) => {

    const response = await api.delete(`/notes/${noteId}/attachments/${attachmentId}`);

    return response.data
};