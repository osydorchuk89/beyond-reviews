import { useForm } from "react-hook-form";
import { BaseButton } from "../../../ui/BaseButton";

interface ChatMessageFormProps {
    onSend: (text: string) => Promise<void>;
}

export const ChatMessageForm = ({ onSend }: ChatMessageFormProps) => {
    const { register, handleSubmit, reset } = useForm<{ text: string }>();

    const handleSend = handleSubmit(async (data) => {
        await onSend(data.text);
        reset();
    });

    return (
        <form
            noValidate
            onSubmit={handleSend}
            className="flex flex-col sm:flex-row gap-3 sm:gap-5 mx-3 sm:mx-5 justify-between sm:items-end"
        >
            <input
                {...register("text", { required: true })}
                className="border border-gray-700 rounded-md p-3 focus:border-orange-900 w-full"
                name="text"
                placeholder="type your message here"
            />
            <div className="w-full sm:w-auto text-center">
                <BaseButton style="orange" type="submit">
                    SEND
                </BaseButton>
            </div>
        </form>
    );
};
