import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  // Check if this is a voice-only call
  const isVoiceOnly = searchParams.get('audio') === 'true';

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) return;

      try {
        console.log("Initializing Stream video client...");

        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);

        // Join the call with camera disabled if it's a voice call
        await callInstance.join({ 
          create: true,
          camera: !isVoiceOnly, // Camera off for voice calls
          microphone: true,     // Microphone always on initially
        });

        if (isVoiceOnly) {
          // Ensure video is disabled for voice-only calls
          await callInstance.camera.disable();
        }

        console.log(`Joined ${isVoiceOnly ? 'voice' : 'video'} call successfully`);

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, authUser, callId, isVoiceOnly]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent isVoiceOnly={isVoiceOnly} />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = ({ isVoiceOnly }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <StreamTheme>
      <div className="flex flex-col items-center">
        {isVoiceOnly && (
          <div className="bg-primary/10 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-medium">Voice Call</h2>
            <p>Camera is disabled for this voice-only call</p>
          </div>
        )}
        <SpeakerLayout />
        <CallControls />
      </div>
    </StreamTheme>
  );
};

export default CallPage;
