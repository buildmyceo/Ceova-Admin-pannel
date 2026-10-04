import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  Search, 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  Pin, 
  Check, 
  CheckCheck, 
  MoreVertical, 
  Plus, 
  CheckSquare, 
  Lock, 
  FileText, 
  Image, 
  Play, 
  Pause, 
  Phone, 
  Video, 
  Sparkles, 
  ThumbsUp, 
  Heart, 
  Flame, 
  PartyPopper,
  X,
  CreditCard,
  Building,
  Calendar,
  Briefcase
} from 'lucide-react';
import { ChatChannel, ChatMessage } from '../types';

interface ChatViewProps {
  onOpenCreateTaskModal?: (prefilled: any) => void;
  onOpenApprovalModal?: (prefilled: any) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onOpenCreateTaskModal,
  onOpenApprovalModal,
}) => {
  const { user, isCSuite, canAccessExecutiveRoom } = useAuth();
  const { 
    channels, 
    messages, 
    sendMessage, 
    addReaction, 
    togglePinMessage, 
    createTaskFromMessage, 
    createApprovalFromMessage 
  } = usePortalData();

  const [activeChannelId, setActiveChannelId] = useState<string>('chan-cctv');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatTypeFilter, setChatTypeFilter] = useState<'all' | 'dm' | 'group' | 'project' | 'executive'>('all');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio simulation state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const channelMessages = messages[activeChannelId] || [];
  const pinnedMessages = channelMessages.filter(m => m.is_pinned);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    await sendMessage(activeChannelId, inputText);
    setInputText('');
  };

  const handleSimulateVoiceNote = async () => {
    await sendMessage(activeChannelId, 'Voice Note (0:24)', {
      type: 'audio',
      name: 'voice_note_update.aac',
      duration: '0:24'
    });
    showToast('Sent voice message');
  };

  const handleSimulateAttachment = async () => {
    await sendMessage(activeChannelId, 'Attached camera benchmark metrics', {
      type: 'file',
      name: 'rtsp_benchmark_profile.json',
      size: '340 KB'
    });
    showToast('Attached file to chat');
  };

  const handleCreateTask = async (msg: ChatMessage) => {
    await createTaskFromMessage(msg);
    showToast(`✓ Task created: "${msg.suggested_task?.title || 'Chat Task'}"`);
  };

  const handleCreateApproval = async (msg: ChatMessage) => {
    await createApprovalFromMessage(msg);
    showToast(`✓ Approval request logged for ${msg.suggested_approval?.amount || 'funds'}`);
  };

  // Filter channels
  const filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.last_message && c.last_message.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (chatTypeFilter === 'all') return true;
    if (chatTypeFilter === 'dm') return c.type === 'dm';
    if (chatTypeFilter === 'group') return c.type === 'group';
    if (chatTypeFilter === 'project') return c.type === 'project';
    if (chatTypeFilter === 'executive') return c.type === 'executive';
    return true;
  });

  // Check clearance for Executive Room
  const isExecutiveRoom = activeChannel?.type === 'executive';
  const hasExecutiveAccess = canAccessExecutiveRoom;

  return (
    <div className="whatsapp-chat-container">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="chat-toast">
          <Sparkles size={14} /> {toastMessage}
        </div>
      )}

      {/* Left Sidebar (WhatsApp style channel list) */}
      <div className="chat-sidebar">
        {/* User Status Bar */}
        <div className="chat-sidebar-header">
          <div className="chat-user-profile">
            <div className="user-avatar-wrap">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="avatar-img" />
              ) : (
                <div className="avatar-fallback">{user?.full_name?.charAt(0) || 'U'}</div>
              )}
              <span className={`user-status-dot status-${user?.status || 'active'}`} />
            </div>
            <div className="chat-header-text">
              <span className="chat-header-title">Ceova Chat</span>
              <span className="chat-header-sub">Online • {user?.full_name}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="chat-search-wrap">
          <div className="chat-search-box">
            <Search size={15} style={{ color: 'var(--text-subtle)' }} />
            <input 
              type="text"
              placeholder="Search chats or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="chat-filter-tabs">
          <button 
            className={`filter-chip ${chatTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setChatTypeFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-chip ${chatTypeFilter === 'project' ? 'active' : ''}`}
            onClick={() => setChatTypeFilter('project')}
          >
            Projects
          </button>
          <button 
            className={`filter-chip ${chatTypeFilter === 'group' ? 'active' : ''}`}
            onClick={() => setChatTypeFilter('group')}
          >
            Groups
          </button>
          <button 
            className={`filter-chip ${chatTypeFilter === 'dm' ? 'active' : ''}`}
            onClick={() => setChatTypeFilter('dm')}
          >
            Direct
          </button>
          <button 
            className={`filter-chip executive-chip ${chatTypeFilter === 'executive' ? 'active' : ''}`}
            onClick={() => setChatTypeFilter('executive')}
          >
            🔒 Executive
          </button>
        </div>

        {/* Channels List */}
        <div className="chat-channel-list">
          {filteredChannels.map((channel) => {
            const isExec = channel.type === 'executive';
            const isActive = channel.id === activeChannelId;

            return (
              <div 
                key={channel.id}
                className={`chat-channel-item ${isActive ? 'active' : ''} ${isExec ? 'executive-channel' : ''}`}
                onClick={() => setActiveChannelId(channel.id)}
              >
                <div className="channel-avatar-wrap">
                  {channel.type === 'dm' && channel.avatar && channel.avatar.startsWith('http') ? (
                    <img src={channel.avatar} alt={channel.name} className="avatar-img" />
                  ) : (
                    <div className={`channel-icon-avatar ${channel.type}`}>
                      {channel.avatar || (channel.type === 'project' ? '📁' : '💬')}
                    </div>
                  )}
                  {isExec && <span className="exec-badge-pill"><Lock size={10} /></span>}
                </div>

                <div className="channel-content">
                  <div className="channel-top-line">
                    <span className="channel-name">{channel.name}</span>
                    <span className="channel-time">{channel.last_timestamp}</span>
                  </div>
                  <div className="channel-bottom-line">
                    <span className="channel-preview-text">{channel.last_message || 'No messages yet'}</span>
                    {(channel.unread_count || 0) > 0 && (
                      <span className="unread-counter">{channel.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Active Window */}
      <div className="chat-main-window">
        {/* If Executive Room and user does NOT have clearance, show locked screen */}
        {isExecutiveRoom && !hasExecutiveAccess ? (
          <div className="restricted-executive-chat-screen">
            <div className="restricted-card">
              <div className="restricted-icon-wrap gold">
                <Lock size={40} style={{ color: '#f59e0b' }} />
              </div>
              <h2>Executive Room • C-Suite Clearance Required</h2>
              <p>
                This channel is strictly encrypted and reserved for the <strong>CEO, CTO, CMO, CFO, and COO</strong>.
                Core team members and interns are prohibited from accessing strategic executive discussions.
              </p>
              <div className="allowed-roles-badge-list">
                <span className="badge-role-ceo">CEO</span>
                <span className="badge-role-cto">CTO</span>
                <span className="badge-role-cmo">CMO</span>
                <span className="badge-role-cfo">CFO</span>
                <span className="badge-role-coo">COO</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setActiveChannelId('chan-cctv')}
                style={{ marginTop: 16 }}
              >
                Switch to Ceova CCTV Project Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Top Header */}
            <div className="chat-top-header">
              <div className="chat-header-identity">
                <div className="header-avatar">
                  {activeChannel.avatar || '💬'}
                </div>
                <div>
                  <div className="header-title-row">
                    <h3>{activeChannel.name}</h3>
                    {isExecutiveRoom && (
                      <span className="badge-gold"><Lock size={11} /> C-Suite Confidential</span>
                    )}
                  </div>
                  <div className="header-status-sub">
                    {activeChannel.topic || `${activeChannel.members_count || 4} members • online`}
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                <button className="btn-icon" title="Voice Room">
                  <Phone size={16} />
                </button>
                <button className="btn-icon" title="Video Meeting">
                  <Video size={16} />
                </button>
                <button className="btn-icon" title="Chat Info">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Pinned Message Banner */}
            {pinnedMessages.length > 0 && (
              <div className="pinned-message-bar">
                <Pin size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <div className="pinned-text">
                  <strong>Pinned:</strong> {pinnedMessages[0].text}
                </div>
              </div>
            )}

            {/* Messages Stream */}
            <div className="chat-messages-area">
              {channelMessages.map((msg) => {
                const isMe = msg.sender_id === user?.id || msg.sender_role === user?.role;

                return (
                  <div 
                    key={msg.id} 
                    className={`chat-message-row ${isMe ? 'message-sent' : 'message-received'}`}
                  >
                    {!isMe && (
                      <div className="msg-sender-avatar">
                        {msg.sender_avatar ? (
                          <img src={msg.sender_avatar} alt={msg.sender_name} className="avatar-img-sm" />
                        ) : (
                          <div className="avatar-fallback-sm">{msg.sender_name.charAt(0)}</div>
                        )}
                      </div>
                    )}

                    <div className="message-bubble">
                      {/* Sender header in group chats */}
                      {!isMe && (
                        <div className="msg-sender-header">
                          <span className="sender-name">{msg.sender_name}</span>
                          <span className={`sender-role-pill role-${msg.sender_role}`}>
                            {msg.sender_role.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Message Text */}
                      <div className="msg-body-text">{msg.text}</div>

                      {/* File / Audio Attachment Card */}
                      {msg.attachment && (
                        <div className="msg-attachment-card">
                          {msg.attachment.type === 'audio' ? (
                            <div className="audio-voice-player">
                              <button 
                                className="audio-play-btn"
                                onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                              >
                                {playingAudioId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                              </button>
                              <div className="waveform-container">
                                {[30, 60, 45, 80, 50, 95, 40, 70, 85, 45, 60, 30].map((height, i) => (
                                  <span 
                                    key={i} 
                                    className={`waveform-bar ${playingAudioId === msg.id ? 'pulsing' : ''}`}
                                    style={{ height: `${height}%` }}
                                  />
                                ))}
                              </div>
                              <span className="audio-duration">{msg.attachment.duration || '0:24'}</span>
                            </div>
                          ) : (
                            <div className="file-attachment-box">
                              <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                              <div className="file-meta">
                                <span className="file-name">{msg.attachment.name}</span>
                                <span className="file-size">{msg.attachment.size || 'PDF Document'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Smart Action Box: "Create Task" or "Request Approval" */}
                      {msg.suggested_task && (
                        <div className="smart-action-box task-trigger">
                          <div className="smart-action-header">
                            <CheckSquare size={14} style={{ color: 'var(--accent-primary)' }} />
                            <span>Actionable Task Detected</span>
                          </div>
                          <div className="smart-action-title">
                            Task: <strong>{msg.suggested_task.title}</strong>
                          </div>
                          <div className="smart-action-sub">
                            Assign to: <strong>{msg.suggested_task.assignee}</strong> • {msg.suggested_task.project}
                          </div>
                          <button 
                            className="btn-smart-action"
                            onClick={() => handleCreateTask(msg)}
                          >
                            <Plus size={12} /> Create Task in Project
                          </button>
                        </div>
                      )}

                      {msg.suggested_approval && (
                        <div className="smart-action-box approval-trigger">
                          <div className="smart-action-header">
                            <CreditCard size={14} style={{ color: '#10b981' }} />
                            <span>Financial Approval Detected</span>
                          </div>
                          <div className="smart-action-title">
                            Amount: <strong>{msg.suggested_approval.amount}</strong>
                          </div>
                          <div className="smart-action-sub">
                            Purpose: {msg.suggested_approval.purpose}
                          </div>
                          <button 
                            className="btn-smart-action-green"
                            onClick={() => handleCreateApproval(msg)}
                          >
                            <Plus size={12} /> Submit Approval Request
                          </button>
                        </div>
                      )}

                      {/* Footer: Timestamp, Status Ticks, Reactions */}
                      <div className="message-meta-footer">
                        <span className="msg-timestamp">{msg.timestamp}</span>
                        {isMe && (
                          <span className="read-status-icon">
                            <CheckCheck size={14} style={{ color: '#38bdf8' }} />
                          </span>
                        )}
                      </div>

                      {/* Reactions display */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="reactions-row">
                          {msg.reactions.map((r: any, rIdx: number) => (
                            <span 
                              key={rIdx} 
                              className="reaction-badge"
                              onClick={() => addReaction(activeChannelId, msg.id, r.emoji)}
                            >
                              {r.emoji} {r.count}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Hover Action Menu */}
                      <div className="msg-hover-actions">
                        <button 
                          className="hover-action-btn" 
                          title="Thumbs up"
                          onClick={() => addReaction(activeChannelId, msg.id, '👍')}
                        >
                          👍
                        </button>
                        <button 
                          className="hover-action-btn" 
                          title="Heart"
                          onClick={() => addReaction(activeChannelId, msg.id, '❤️')}
                        >
                          ❤️
                        </button>
                        <button 
                          className="hover-action-btn" 
                          title="Pin message"
                          onClick={() => togglePinMessage(activeChannelId, msg.id)}
                        >
                          <Pin size={12} />
                        </button>
                        <button 
                          className="hover-action-btn create-task-hover"
                          title="Convert to Task"
                          onClick={() => handleCreateTask(msg)}
                        >
                          <CheckSquare size={12} /> Task
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar (WhatsApp-style) */}
            <form className="chat-bottom-input-bar" onSubmit={handleSend}>
              <div className="input-left-buttons">
                <button 
                  type="button" 
                  className="input-tool-btn" 
                  title="Emoji"
                  onClick={() => setInputText(prev => prev + ' 👍 ')}
                >
                  <Smile size={18} />
                </button>
                <button 
                  type="button" 
                  className="input-tool-btn" 
                  title="Attach File"
                  onClick={handleSimulateAttachment}
                >
                  <Paperclip size={18} />
                </button>
              </div>

              <input
                type="text"
                className="chat-text-input"
                placeholder={`Message #${activeChannel.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              <div className="input-right-buttons">
                {inputText.trim() ? (
                  <button type="submit" className="btn-send-message" title="Send Message">
                    <Send size={16} />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn-mic-message" 
                    title="Send Voice Note"
                    onClick={handleSimulateVoiceNote}
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
