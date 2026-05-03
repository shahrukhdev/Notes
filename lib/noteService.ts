import api from "./api";

type NoteFilters = {
  isPinned?: boolean;
  isArchived?: boolean;
};

export const getNotes = async (search ?: string, page ?: number, limit ?: number, filters ?: NoteFilters) => {

    const params: any = {
        search,
        page,
        limit,
    };

    if (filters?.isPinned) {
        params.isPinned = true;
    }

    if (filters?.isArchived) {
        params.isArchived = true;
    }

    const response = await api.get("/notes", { params });

    return response.data;
};

export interface NotePayloadInterface {
    title: string;
    content: string;
    category?: string;
    tagIds?: string[];
    isPinned?: boolean;
    isArchived?: boolean;
};

export const addNote = async (data: NotePayloadInterface) => {

    const response = await api.post("/notes", data);

    return response.data;
};

export const updateNote = async (noteId: string, data: NotePayloadInterface) => {

    const response = await api.put(`/notes/${noteId}`, data);

    return response.data;
};

export const deleteNote = async (noteId: string) => {

    const response = await api.delete(`/notes/${noteId}`);

    return response.data;
};