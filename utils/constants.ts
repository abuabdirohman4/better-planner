import { StylesConfig } from "react-select";

export const SESSIONKEY = {
  clientId: "clientId",
  periodName: "periodName",
};

export const LOCALKEY = {
  clientId: "clientId",
};

export const customStyles: StylesConfig = {
  control: (provided: Record<string, unknown>, state: any) => ({
    ...provided,
    border: state.isFocused ? "" : "1px solid #E9E9E9",
    borderRadius: "0.5rem",
    boxShadow: "none",
    "&:focus-within": {
      borderColor: "#0BCAD4",
    },
    padding: "3px 0px",
  }),
};
