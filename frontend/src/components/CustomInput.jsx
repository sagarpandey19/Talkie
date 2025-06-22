import { useMessageInputContext } from 'stream-chat-react';
import { SendIcon, PaperclipIcon, CameraIcon, SmileIcon } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

const CustomInput = (props) => {
  const { 
    handleSubmit,
    text,
    handleChange,
    channel,
    setText
  } = useMessageInputContext();
  
  // Custom message sending function
  const sendMessage = (event) => {
    event.preventDefault();
    
    if (!text || !text.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (!channel) {
      console.error("Channel not available:", channel);
      // Try to get channel from global reference
      const globalChannel = window.streamActiveChannel || 
                          (window.streamChatClient && window.streamChatClient.activeChannel);
      
      if (globalChannel) {
        console.log("Using global channel reference");
        try {
          globalChannel.sendMessage({
            text: text
          }).then(() => {
            setText('');
            // Removed toast.success notification
          }).catch(err => {
            console.error("Error sending with global channel:", err);
            toast.error("Failed to send message: " + (err.message || "Please try again"));
          });
        } catch (error) {
          console.error("Error with global channel:", error);
          toast.error("Chat connection unavailable. Please refresh the page.");
        }
        return;
      }
      
      toast.error("Chat connection unavailable. Please refresh the page.");
      return;
    }
    
    try {
      // Try sending with Stream's built-in handler first
      handleSubmit(event);
      
      // If that doesn't work, try sending directly with the channel
      setTimeout(() => {
        // Check if text was cleared (indicating successful send)
        if (text) {
          console.log("Trying direct channel send as fallback");
          channel.sendMessage({
            text: text
          }).then(() => {
            setText('');
            // No success toast here
          }).catch(err => {
            console.error("Error sending message:", err);
            toast.error("Failed to send message");
          });
        }
      }, 300);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Try direct channel send as fallback
      try {
        channel.sendMessage({
          text: text
        }).then(() => {
          setText('');
          console.log("Message sent via fallback");
          // Removed toast.success notification
        }).catch(err => {
          console.error("Fallback send failed:", err);
          toast.error("Failed to send message");
        });
      } catch (fallbackError) {
        console.error("All send attempts failed:", fallbackError);
        toast.error("Could not send message");
      }
    }
  };
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // Show tooltip on first focus
  const handleFocus = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    // Add the emoji to the text at current cursor position
    setText((prevText) => prevText + emojiObject.emoji);
    // Close the emoji picker
    setShowEmojiPicker(false);
  };
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Handle file attachment
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Handle camera click
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !channel) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Show loading toast
      const loadingToast = toast.loading(`Uploading ${file.name}...`);
      
      // Upload file to Stream
      const response = await channel.sendFile(formData);
      
      // Determine file type for appropriate message
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      
      let fileType = 'file';
      if (isImage) fileType = 'image';
      if (isVideo) fileType = 'video';
      if (isAudio) fileType = 'audio';
      
      // Send message with attachment
      await channel.sendMessage({
        text: `Shared ${fileType === 'file' ? 'a file' : `${fileType}`}`,
        attachments: [
          {
            type: fileType,
            asset_url: response.file,
            title: file.name,
            mime_type: file.type,
            file_size: file.size,
          },
        ],
      });
      
      // Update toast - just dismiss it instead of showing success
      toast.dismiss(loadingToast);
      // Removed toast.success notification
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    }
    
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="str-chat__input-flat whatsapp-input-container">
      <div className="whatsapp-input-wrapper">
        {/* WhatsApp-style input area */}
        <div className="whatsapp-input-area">
          {/* Emoji button */}
          <button 
            ref={emojiButtonRef}
            className="whatsapp-icon-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            type="button"
            aria-label="Emoji picker"
          >
            <SmileIcon size={20} />
          </button>
          
          {/* Emoji picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="whatsapp-emoji-picker">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                lazyLoadEmojis={true}
                searchDisabled={false}
                width={300}
                height={400}
              />
            </div>
          )}
          
          {/* Textarea */}
          <div className="whatsapp-textarea-container">
            <textarea
              className="whatsapp-textarea"
              value={text || ''}
              onChange={handleChange}
              placeholder="Message"
              onFocus={handleFocus}
              onKeyPress={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(event);
                }
              }}
            />
          </div>
          
          {/* Attachment button */}
          <button 
            className="whatsapp-icon-button"
            onClick={handleAttachmentClick}
            type="button"
            aria-label="Attach file"
          >
            <PaperclipIcon size={20} />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden-input"
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,application/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
          </button>
          
          {/* Camera button (only shown when text is empty) */}
          {!text && (
            <button 
              className="whatsapp-icon-button"
              onClick={handleCameraClick}
              type="button"
              aria-label="Camera"
            >
              <CameraIcon size={20} />
              <input
                type="file"
                ref={cameraInputRef}
                className="hidden-input"
                onChange={handleFileUpload}
                accept="image/*,video/*"
                capture="environment"
              />
            </button>
          )}
        </div>
        
        {/* Voice recorder or Send button */}
        <div className="whatsapp-action-button">
          {!text ? (
            <VoiceRecorder channel={channel || window.streamActiveChannel} />
          ) : (
            <button
              className="whatsapp-send-button"
              onClick={(event) => sendMessage(event)}
              type="button"
              aria-label="Send message"
            >
              <SendIcon size={20} />
            </button>
          )}
        </div>
      </div>
      
      {/* Tooltip for mobile instructions */}
      <div className={`whatsapp-tooltip ${showTooltip ? 'visible' : ''}`}>
        Hold to record, release to send
      </div>
    </div>
  );
};

export default CustomInput;