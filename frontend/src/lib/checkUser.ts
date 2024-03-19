import axios from "axios";
import { BASE_URL } from "../lib/urls";

export const checkUser = async () => {
    const result = await axios({
        method: "get",
        url: BASE_URL + "protected",
        withCredentials: true,
    });
    if (result) {
        return result.data;
    } else {
        return new Error("Couldn't get user status");
    }
};
