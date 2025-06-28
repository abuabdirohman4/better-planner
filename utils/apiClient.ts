import { AxiosResponse } from "axios";
import axios from "../configs/axios";

type Props = {
  url: string;
  params?: Record<string, any>;
  token?: string;
  formData?: boolean;
  payload?: {};
  data?: {};
};

export async function getData({ url, params, token }: Props): Promise<any> {
  try {
    console.log("Making GET request to:", url);
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
    console.log("Making POST request to:", url);
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
    console.log("Making PUT request to:", url);
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

export async function deleteData({ url, data, token }: Props): Promise<any> {
  try {
    console.log("Making DELETE request to:", url);
    const response: AxiosResponse = await axios.delete(url, {
      data,
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json", // Pastikan tipe konten yang benar
      },
    });
    return response;
  } catch (error) {
    console.error("Error in deleteData:", error);
    throw error;
  }
}

// Client API functions
export const updateClientAPI = async (
  id: number,
  data: { periodName?: string; email?: string; name?: string }
) => {
  try {
    const response = await fetch(`/api/clients?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      status: response.status,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      status: 500,
      data: null,
    };
  }
};

export const fetchClientsAPI = async () => {
  try {
    const response = await fetch("/api/clients");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      status: response.status,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return {
      status: 500,
      data: [],
    };
  }
};

export const fetchClientAPI = async (id: number) => {
  try {
    const response = await fetch(`/api/clients?id=${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      status: response.status,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return {
      status: 500,
      data: null,
    };
  }
};

export const fetchHighFocusGoalsAPI = async (params: {
  periodName?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.periodName) {
      queryParams.append("periodName", params.periodName);
    }

    const response = await fetch(`/api/high-focus-goals?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      status: response.status,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Error fetching high focus goals:", error);
    return {
      status: 500,
      data: [],
    };
  }
};
