import { AxiosResponse } from "axios";
import axios from "../configs/axios";

type Props = {
  url: string;
  params?: Record<string, any>;
  token?: string;
  formData?: boolean;
  payload?: {};
};

export async function getData({ url, params, token }: Props): Promise<any> {
  try {
    // console.log("Making GET request to:", url);
    const response: AxiosResponse = await axios.get(url, {
      params,
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    // console.log("getData response:", response.data);
    return response;
  } catch (error) {
    console.error("Error in getData:", error);
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
    // console.log("Making POST request to:", url);
    const response: AxiosResponse = await axios.post(`${url}`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": formData ? "multipart/form-data" : "application/json",
      },
    });
    // console.log("postData response:", response.data);
    return response;
  } catch (error) {
    console.error("Error in postData:", error);
    return error;
  }
}

export async function putData({ url, payload, token }: Props): Promise<any> {
  try {
    // console.log("Making PUT request to:", url);
    const response: AxiosResponse = await axios.put(url, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    // console.log("putData response:", response.data);
    return response;
  } catch (error) {
    console.error("Error in putData:", error);
    throw error;
  }
}

export async function deleteData({ url, token }: Props): Promise<any> {
  try {
    // console.log("Making DELETE request to:", url);
    const response: AxiosResponse = await axios.delete(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    // console.log("deleteData response:", response.data);
    return response;
  } catch (error) {
    console.error("Error in deleteData:", error);
    throw error;
  }
}
