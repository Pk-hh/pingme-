export const mockChats = [
    {
        id: 1,
        name: "Alice Johnson",
        lastMessage: "Hey! Are we still on for lunch?",
        time: "10:30 AM",
        unread: 2,
        avatarColor: "#FF5733",
        messages: [
            { id: 1, text: "Hey! Are we still on for lunch?", time: "10:30 AM", sender: "incoming" }
        ]
    },
    {
        id: 2,
        name: "Bob Smith",
        lastMessage: "Can you send me the report?",
        time: "Yesterday",
        unread: 0,
        avatarColor: "#33FF57",
        messages: [
            { id: 1, text: "Can you send me the report?", time: "Yesterday", sender: "incoming" },
            { id: 2, text: "Sure, let me find it.", time: "Yesterday", sender: "outgoing" }
        ]
    },
    {
        id: 3,
        name: "Carol Williams",
        lastMessage: "The meeting is rescheduled to 3 PM.",
        time: "Tuesday",
        unread: 5,
        avatarColor: "#3357FF",
        messages: [
            { id: 1, text: "The meeting is rescheduled to 3 PM.", time: "Tuesday", sender: "incoming" }
        ]
    },
    {
        id: 4,
        name: "David Brown",
        lastMessage: "Thanks for your help!",
        time: "Monday",
        unread: 0,
        avatarColor: "#FF33F5",
        messages: [
            { id: 1, text: "Here is the code you asked for.", time: "Monday", sender: "outgoing" },
            { id: 2, text: "Thanks for your help!", time: "Monday", sender: "incoming" }
        ]
    },
    {
        id: 5,
        name: "Eva Davis",
        lastMessage: "Happy Birthday! \uD83C\uDF82",
        time: "Sunday",
        unread: 1,
        avatarColor: "#33FFF5",
        messages: [
            { id: 1, text: "Happy Birthday! \uD83C\uDF82", time: "Sunday", sender: "incoming" }
        ]
    }
];
