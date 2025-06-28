import { googleSheetsService, SHEET_NAMES } from "@/configs/googleSheets";

export interface Client {
  id: number;
  email: string;
  name?: string;
  periodName: string;
}

export interface CreateClientData {
  email: string;
  name?: string;
  periodName: string;
}

export interface UpdateClientData {
  email?: string;
  name?: string;
  periodName?: string;
}

export const fetchClients = async (): Promise<{
  status: number;
  data: Client[];
}> => {
  try {
    const clients = await googleSheetsService.getAll(SHEET_NAMES.CLIENTS);
    return { status: 200, data: clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { status: 500, data: [] };
  }
};

export const fetchClient = async (
  id: number
): Promise<{ status: number; data: Client | null }> => {
  try {
    const client = await googleSheetsService.getById(SHEET_NAMES.CLIENTS, id);
    if (!client) {
      return { status: 404, data: null };
    }
    return { status: 200, data: client };
  } catch (error) {
    console.error("Error fetching client:", error);
    return { status: 500, data: null };
  }
};

export const createClient = async (
  data: CreateClientData
): Promise<{ status: number; data: Client | null }> => {
  try {
    const newClient = await googleSheetsService.create(
      SHEET_NAMES.CLIENTS,
      data
    );
    return { status: 201, data: newClient };
  } catch (error) {
    console.error("Error creating client:", error);
    return { status: 500, data: null };
  }
};

export const updateClient = async (
  id: number,
  data: UpdateClientData
): Promise<{ status: number; data: Client | null }> => {
  try {
    const updatedClient = await googleSheetsService.update(
      SHEET_NAMES.CLIENTS,
      id,
      data
    );
    return { status: 200, data: updatedClient };
  } catch (error) {
    console.error("Error updating client:", error);
    return { status: 500, data: null };
  }
};

export const deleteClient = async (
  id: number
): Promise<{ status: number; message: string }> => {
  try {
    await googleSheetsService.delete(SHEET_NAMES.CLIENTS, id);
    return { status: 204, message: "Client deleted successfully" };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { status: 500, message: "Internal Server Error" };
  }
};
