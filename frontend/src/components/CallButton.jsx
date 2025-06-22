import { VideoIcon, PhoneIcon } from "lucide-react";

function CallButton({ handleVideoCall, handleVoiceCall }) {
  return (
    <div className="p-3 border-b flex items-center justify-end gap-2 max-w-7xl mx-auto w-full absolute top-0">
      <button onClick={handleVoiceCall} className="btn btn-primary btn-sm text-white" title="Voice Call">
        <PhoneIcon className="size-6" />
      </button>
      <button onClick={handleVideoCall} className="btn btn-success btn-sm text-white" title="Video Call">
        <VideoIcon className="size-6" />
      </button>
    </div>
  );
}

export default CallButton;
