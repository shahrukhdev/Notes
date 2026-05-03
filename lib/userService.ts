import api from "./api";

export const getUser = async () => {

    const response = await api.get("/user");

    return response.data;
};

export interface UserPayloadInterface {
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    profileImage?: string,
}

export const updateUser = async (data: UserPayloadInterface) => {

    const response = await api.post("/update-user", data, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
};