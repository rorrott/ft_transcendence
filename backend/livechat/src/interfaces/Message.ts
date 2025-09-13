interface Message
{
    id: number,
    sender_id: string,
    receiver_id: string,
    isCmd: boolean;
    message: string;
    timestamp: string;
}