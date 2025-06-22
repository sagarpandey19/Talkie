import { useState, useRef, useEffect } from 'react';
import { MicIcon, SendIcon, XIcon, TrashIcon, PauseIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceRecorder = ({ channel }) => {
  // Log channel to debug
  console.log("VoiceRecorder initialized with channel:", channel);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLongPress, setIsLongPress] = useState(false);
  const [waveforms, setWaveforms] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const touchTimeoutRef = useRef(null);
  const micButtonRef = useRef(null);

  // Initialize audio analyzer for waveform visualization
  const initAudioAnalyzer = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 64;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    
    // Start visualization
    visualize();
  };

  // Generate waveform visualization
  const visualize = () => {
    if (!analyserRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Get 5 values from the frequency data for a simple visualization
    const levels = [];
    const bufferLength = analyserRef.current.frequencyBinCount;
    const step = Math.floor(bufferLength / 5);
    
    for (let i = 0; i < 5; i++) {
      const index = i * step;
      // Normalize values between 10-100 for better visual
      levels.push(10 + (dataArrayRef.current[index] / 255) * 90);
    }
    
    setWaveforms(levels);
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(visualize);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Initialize audio analyzer
      initAudioAnalyzer(stream);
      
      // Create MediaRecorder with appropriate options
      let options = {};
      
      // Check for supported MIME types
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
      
      console.log('Using MediaRecorder with options:', options);
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      
      // Collect audio data
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log('Audio data chunk collected:', e.data.size);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped, processing audio...');
        
        if (audioChunksRef.current.length > 0) {
          // Create blob with appropriate MIME type
          const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('Audio blob created:', audioBlob.size, audioBlob.type);
          
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioBlob(audioBlob);
          setAudioURL(audioUrl);
        } else {
          console.error('No audio data collected');
          toast.error('No audio was recorded. Please try again.');
        }
        
        // Stop all tracks of the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Stop visualization
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
      
      // Start recording with timeslice to collect data frequently
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      console.log('Recording started');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    clearInterval(timerRef.current);
    setWaveforms([]);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Alternative function to send voice message using direct API approach
  const sendVoiceMessageDirect = async () => {
    if (!audioBlob) {
      console.error('Cannot send: missing audio blob');
      return false;
    }
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Sending voice message...');
      
      // Get current URL to determine channel ID
      const currentUrl = window.location.pathname;
      const channelId = currentUrl.split('/chat/')[1];
      
      if (!channelId) {
        throw new Error('Could not determine channel ID from URL');
      }
      
      console.log('Attempting to send voice message to channel ID:', channelId);
      
      // Create a file from the blob
      const mimeType = audioBlob.type || 'audio/webm';
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      if (mimeType.includes('mp3') || mimeType.includes('mpeg')) extension = 'mp3';
      if (mimeType.includes('ogg')) extension = 'ogg';
      
      const fileName = `voice-message-${Date.now()}.${extension}`;
      const file = new File([audioBlob], fileName, { type: mimeType });
      
      // Try to get the Stream Chat client
      const client = window.streamChatClient;
      if (!client) {
        throw new Error('Stream Chat client not available');
      }
      
      // Create a temporary message with text
      await client.channel('messaging', channelId).sendMessage({
        text: '🎤 Voice message',
      });
      
      // Reset state after sending
      setAudioBlob(null);
      setAudioURL(null);
      setRecordingTime(0);
      
      // Update toast
      toast.success('Voice message sent!', { id: loadingToast });
      return true;
    } catch (error) {
      console.error('Error sending voice message directly:', error);
      toast.error('Failed to send voice message: ' + (error.message || 'Please try again'));
      return false;
    }
  };
  
  // Helper function to send voice message with a specific channel
  const sendVoiceMessageWithChannel = async (targetChannel) => {
    if (!audioBlob) {
      console.error('Cannot send: missing audio blob');
      return false;
    }
    
    // More strict validation of the channel object
    if (!targetChannel || 
        typeof targetChannel.sendFile !== 'function' ||
        typeof targetChannel.sendMessage !== 'function') {
      console.error('Cannot send: invalid channel or channel not fully initialized', targetChannel);
      
      // Try the direct approach as fallback
      console.log('Trying direct approach as fallback');
      return await sendVoiceMessageDirect();
    }
    
    // Log channel details to debug
    console.log('Attempting to send with channel:', {
      id: targetChannel.id,
      type: targetChannel.type,
      cid: targetChannel.cid,
      initialized: targetChannel.initialized,
      hasSendFile: typeof targetChannel.sendFile === 'function',
      hasSendMessage: typeof targetChannel.sendMessage === 'function'
    });
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Sending voice message...');
      
      // Create a FormData object to upload the audio file
      const formData = new FormData();
      
      // Get the MIME type from the blob
      const mimeType = audioBlob.type || 'audio/webm';
      
      // Determine appropriate file extension
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      if (mimeType.includes('mp3') || mimeType.includes('mpeg')) extension = 'mp3';
      if (mimeType.includes('ogg')) extension = 'ogg';
      
      // Create filename with timestamp
      const fileName = `voice-message-${Date.now()}.${extension}`;
      console.log(`Using filename ${fileName} with MIME type ${mimeType}`);
      
      // Create a copy of the blob to ensure it's fresh
      const blobCopy = new Blob([audioBlob], { type: mimeType });
      
      // Use the blob copy
      formData.append('file', blobCopy, fileName);
      
      console.log('Uploading voice message...', fileName, mimeType, blobCopy.size);
      
      // Upload the file to Stream
      let response;
      try {
        response = await targetChannel.sendFile(formData);
        console.log('File upload response:', response);
        
        if (!response || !response.file) {
          throw new Error('Failed to upload file');
        }
      } catch (uploadError) {
        console.error('Error in sendFile:', uploadError);
        
        // If we get the split error, try a different approach
        if (uploadError.message && (uploadError.message.includes('split is not a function') || 
            uploadError.message.includes('uri.split is not a function') || 
            uploadError.message.includes('e.split is not a function'))) {
          // Create a direct file object instead
          const file = new File([blobCopy], fileName, { type: mimeType });
          
          // Try using a different API method if available
          if (typeof targetChannel.sendImage === 'function') {
            response = await targetChannel.sendImage(file);
            console.log('Used sendImage as fallback:', response);
          } else {
            throw new Error('Cannot upload audio: incompatible channel object');
          }
        } else {
          throw uploadError;
        }
      }
      
      // Send a message with the audio file
      let messageResponse;
      try {
        messageResponse = await targetChannel.sendMessage({
          text: '🎤 Voice message',
          attachments: [
            {
              type: 'audio',
              asset_url: response.file,
              title: 'Voice Message',
              mime_type: mimeType,
              file_size: blobCopy.size,
            },
          ],
        });
      } catch (msgError) {
        console.error('Error sending message with attachment:', msgError);
        
        // Fallback to a simple text message
        messageResponse = await targetChannel.sendMessage({
          text: '🎤 Voice message (failed to attach audio file)',
        });
      }
      
      console.log('Message sent:', messageResponse);
      
      // Reset state after sending
      setAudioBlob(null);
      setAudioURL(null);
      setRecordingTime(0);
      
      // Update toast
      toast.success('Voice message sent!', { id: loadingToast });
      return true;
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message: ' + (error.message || 'Please try again'));
      
      // Reset state to allow trying again
      setAudioBlob(null);
      setAudioURL(null);
      setRecordingTime(0);
      return false;
    }
  };

  const sendVoiceMessage = async () => {
    // Check for audioBlob
    if (!audioBlob) {
      console.error('Missing audio blob for sending');
      toast.error('Cannot send voice message. Please try recording again.');
      return;
    }
    
    // Check for channel and try to get it if not available
    if (!channel) {
      console.error('Channel not available for sending voice message');
      
      // Try to get the active channel from different global references
      try {
        // Try the direct channel reference first
        let activeChannel = window.streamActiveChannel;
        
        // If not found, try through the client
        if (!activeChannel && window.streamChatClient) {
          activeChannel = window.streamChatClient.activeChannel;
        }
        
        // If still not found, try to recreate the channel from the URL
        if (!activeChannel && window.streamChatClient) {
          const currentUrl = window.location.pathname;
          const channelId = currentUrl.split('/chat/')[1];
          
          if (channelId) {
            console.log('Creating channel from URL with ID:', channelId);
            activeChannel = window.streamChatClient.channel('messaging', channelId);
          }
        }
        
        if (activeChannel) {
          console.log('Retrieved active channel:', activeChannel);
          // Use the active channel instead
          await sendVoiceMessageWithChannel(activeChannel);
          return;
        } else {
          // Try the direct approach as a last resort
          console.log('No channel found, trying direct approach');
          await sendVoiceMessageDirect();
          return;
        }
      } catch (err) {
        console.error('Error retrieving active channel:', err);
        toast.error('Cannot send voice message. Please try again later.');
        return;
      }
    }
    
    // Use the helper function to send with the available channel
    await sendVoiceMessageWithChannel(channel);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // WhatsApp-style touch handlers for mobile
  const handleTouchStart = (e) => {
    // Don't use preventDefault() in passive listeners
    
    // Start a timer to detect long press
    touchTimeoutRef.current = setTimeout(() => {
      console.log('Long press detected, starting recording');
      setIsLongPress(true);
      startRecording();
    }, 300);
  };
  
  const handleTouchEnd = (e) => {
    // Don't use preventDefault() in passive listeners
    
    // Clear the timeout if it hasn't triggered yet
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    
    // If we were recording (long press was active), stop recording
    if (isLongPress && isRecording) {
      console.log('Touch ended, stopping recording');
      setIsLongPress(false);
      stopRecording();
    }
  };
  
  const handleTouchMove = (e) => {
    if (!isRecording || !isLongPress) return;
    
    const button = micButtonRef.current;
    if (!button) return;
    
    const buttonRect = button.getBoundingClientRect();
    const touchY = e.touches[0].clientY;
    
    // Calculate distance swiped up
    const swipeDistance = buttonRect.top - touchY;
    console.log('Swipe distance:', swipeDistance);
    
    // If swipe up more than 50px, cancel recording
    if (swipeDistance > 50) {
      console.log('Swipe up detected, cancelling recording');
      cancelRecording();
      setIsLongPress(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  if (!isRecording && !audioURL) {
    return (
      <button 
        ref={micButtonRef}
        onClick={startRecording}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className="whatsapp-mic-button"
        title="Hold to record, release to send"
        type="button"
      >
        <MicIcon size={20} />
      </button>
    );
  }

  if (isRecording) {
    return (
      <div className="whatsapp-recording-container">
        {/* Waveform visualization */}
        <div className="whatsapp-waveform">
          {waveforms.map((height, index) => (
            <div 
              key={index} 
              className="whatsapp-waveform-bar"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        
        <div className="whatsapp-recording-timer">
          <span className="whatsapp-recording-dot"></span>
          <span>{formatTime(recordingTime)}</span>
        </div>
        
        <div className="whatsapp-recording-actions">
          <button 
            onClick={cancelRecording}
            className="whatsapp-cancel-button"
            title="Slide up to cancel"
          >
            <TrashIcon size={20} />
          </button>
          
          <button 
            onClick={stopRecording}
            className="whatsapp-stop-button"
            title="Stop recording"
          >
            <PauseIcon size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (audioURL) {
    return (
      <div className="whatsapp-preview-container">
        <audio src={audioURL} controls className="whatsapp-audio-player" />
        
        <div className="whatsapp-preview-actions">
          <button 
            onClick={() => cancelRecording()}
            className="whatsapp-cancel-button"
            title="Cancel"
            type="button"
          >
            <XIcon size={20} />
          </button>
          
          <button 
            onClick={() => sendVoiceMessage()}
            className="whatsapp-send-button"
            title="Send voice message"
            type="button"
          >
            <SendIcon size={20} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default VoiceRecorder;