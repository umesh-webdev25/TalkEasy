export const SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    MESSAGE: 'message',
    
    // Legacy support
    AUDIO_STREAM_READY: 'audio_stream_ready',
    AUDIO_CHUNK_RECEIVED: 'audio_chunk_received',
    COMMAND_RESPONSE: 'command_response',
    TTS_AUDIO_CHUNK: 'tts_audio_chunk',
    
    // New Streaming Protocol
    STREAM_START: 'stream:start',
    STREAM_CHUNK: 'stream:chunk',
    STREAM_END: 'stream:end',
    STREAM_ERROR: 'stream:error',
    STREAM_CANCEL: 'stream:cancel',
    
    // Job Notifications
    JOB_COMPLETE: 'job:complete',
    JOB_FAILED: 'job:failed'
};
