import { AxiosResponse } from "axios";
import axios from "../configs/axios";

type Props = {
  url: string;
  params?: Record<string, any>;
  token?: string;
  formData?: boolean;
  payload?: {};
};

export async function getData({
  url,
  params,
  token,
}: Props): Promise<AxiosResponse> {
  try {
    return await axios.get(`${url}`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function postData({
  url,
  payload,
  token,
  formData,
}: Props): Promise<any> {
  try {
    return await axios.post(`${url}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": formData ? "multipart/form-data" : "application/json",
      },
    });
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function putData({ url, payload }: Props) {
  try {
    return await axios.put(`${url}`, payload);
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function deleteData({ url, token }: Props): Promise<any> {
  try {
    return await axios.delete(`${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.log(error);
    return error;
  }
}
