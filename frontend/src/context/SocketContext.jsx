import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import io from "socket.io-client";
import userAtom from "../atoms/userAtom";
// We use context and wrap the context in route app. So socket instance is available all over the client. SOcket instance mean connecting to the backend socket that we make
const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const user = useRecoilValue(userAtom);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      // connecting to backend
      query: {
        userId: user?._id, // this query and along with query send the user id of the current user
      },
    });

    setSocket(socket); // state set

    socket.on("getOnlineUsers", (users) => {
      // Here accepting the event that we emit in backend for online users
      setOnlineUsers(users);
    });
    return () => socket && socket.close(); // This calls when this component get dismount so mean user go so close the connection. and this socket cause to call the disconnect on backedn
    // On Unmount: When the component is about to be removed from the UI (unmounted), the function provided in the return statement is executed. This is commonly referred to as the cleanup function. The purpose of this function is to clean up any side effects introduced in the useEffect to prevent memory leaks and unintended behavior. So in this case, it will close the socket connection, ensuring that the client is disconnected from the server when the component is removed from the UI.
  }, [user?._id]);

  return (
    // This value is available in all the app. which is the socket connection and the online users.
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
