import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import CustomInput from "../components/CustomInput";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initializing stream chat client...");
        
        // Add retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let connected = false;
        
        while (!connected && retryCount < maxRetries) {
          try {
            // Check if client already exists to prevent multiple instances
            let client = chatClient;
            
            if (!client) {
              client = StreamChat.getInstance(STREAM_API_KEY);
              
              // Only connect user if not already connected
              if (!client.userID) {
                await client.connectUser(
                  {
                    id: authUser._id,
                    name: authUser.fullName,
                    image: authUser.profilePic,
                  },
                  tokenData.token
                );
              }
              
              setChatClient(client);
            }

            const channelId = [authUser._id, targetUserId].sort().join("-");
            console.log("Creating channel with ID:", channelId);

            // Create or get the channel
            const currChannel = client.channel("messaging", channelId, {
              members: [authUser._id, targetUserId],
            });

            await currChannel.watch();
            console.log("Channel initialized:", currChannel.id);
            
            setChannel(currChannel);
            
            // Make the client and active channel globally available for components
            window.streamChatClient = client;
            window.streamChatClient.activeChannel = currChannel;
            
            // Store channel reference in a more reliable way
            window.streamActiveChannel = currChannel;
            
            connected = true;
          } catch (retryError) {
            retryCount++;
            console.error(`Connection attempt ${retryCount} failed:`, retryError);
            
            if (retryCount >= maxRetries) {
              throw retryError;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
    
    // Cleanup function to disconnect user when component unmounts
    return () => {
      if (chatClient) {
        // Don't disconnect, just cleanup the channel
        setChannel(null);
        
        // Clean up global references
        if (window.streamChatClient) {
          window.streamChatClient.activeChannel = null;
        }
        window.streamActiveChannel = null;
      }
    };
  }, [tokenData, authUser, targetUserId, chatClient]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      // Removed toast.success notification
      
      // Open call in new tab
      window.open(callUrl, "_blank");
    }
  };

  const handleVoiceCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}?audio=true`;

      channel.sendMessage({
        text: `I've started a voice call. Join me here: ${callUrl}`,
      });

      // Removed toast.success notification
      
      // Open call in new tab
      window.open(callUrl, "_blank");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton 
              handleVideoCall={handleVideoCall} 
              handleVoiceCall={handleVoiceCall}
            />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput Input={CustomInput} focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
