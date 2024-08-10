import { Client } from "@/types";
import { getData, postData, putData, deleteData } from "@/utils/apiClient";

export async function fetchClients(): Promise<any> {
  try {
    return await getData({
      url: "/clients",
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Failed to fetch clients");
  }
}

export async function fetchClient(id: number): Promise<any> {
  try {
    return await getData({
      url: `/clients/${id}`,
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    throw new Error("Failed to fetch client");
  }
}

export async function createClient(clientData: Client): Promise<any> {
  try {
    return await postData({
      url: "/clients",
      payload: clientData,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    throw new Error("Failed to create client");
  }
}

export async function updateClient(
  id: number,
  clientData: Client
): Promise<any> {
  try {
    return await putData({
      url: `/clients/${id}`,
      payload: clientData,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    throw new Error("Failed to update client");
  }
}

export async function deleteClient(id: number): Promise<any> {
  try {
    await deleteData({
      url: `/clients/${id}`,
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    throw new Error("Failed to delete client");
  }
}
