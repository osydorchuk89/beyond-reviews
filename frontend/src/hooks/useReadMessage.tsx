import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { BASE_API_URL } from "../lib/urls";
// import { queryClient } from "../lib/requests";

// interface UseReadMessageProps {
//     messageId: string;
// }

export const useReadMessage = (messageId: string) => {
    const { mutate } = useMutation({
        mutationFn: async () => {
            await axios({
                method: "put",
                url: BASE_API_URL + "messages/" + messageId,
            });
        },
        // onSuccess: (data) => {
        //     queryClient.setQueryData(["todo", { id: 5 }], data);
        // },
    });

    return mutate;
};
