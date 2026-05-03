import api from "./api";

export interface TagPayloadInterface {
    name: string,
    isActive: boolean
};

export const getTags = async (search ?: string, page ?: number, limit ?: number) => {

    const response = await api.get("/tags", {
        params: { search, page, limit }
    });

    return response.data;
};

export const createTag = async (data: TagPayloadInterface) => {

    const response = await api.post("/tags", data);

    return response.data;
};

export const updateTag = async (tagId: string, data: TagPayloadInterface) => {

    const response = await api.put(`/tags/${tagId}`, data);

    return response.data;
};

export const deleteTag = async (tagId: string) => {

    const response = await api.delete(`/tags/${tagId}`);

    return response.data;
};