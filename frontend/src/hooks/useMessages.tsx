import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Message } from "../lib/types"
import { getMessages } from "../lib/requests"

type ResultWithPrevious<T> = {
    current: T
    previous?: T
  }

  const fetchWithPrevious = async (userId: string, otherUserId: string, previous?: ResultWithPrevious<T>): Promise<ResultWithPrevious<T> => {
    const { data } = await getMessages(userId, otherUserId)
    
    return { previous: previous.current, current: data }
  }
  
  export const useTodos = (userId: string, otherUserId: string) => {
    const queryClient = useQueryClient()
    const previousTodos = queryClient.getQueryData<Message[]>(["messages"])
    return useQuery({queryKey: ["messages"], queryFn: () => fetchWithPrevious<Message[]>(userId, otherUserId, previousTodos)})
  }