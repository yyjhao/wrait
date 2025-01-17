import { FC, ReactNode, useEffect, useRef } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import styles from "./Chat.module.css";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { SendIcon } from "lucide-react";

export type TextMessage = {
  id: string;
  createdAt?: Date;
  content: string;
  role: "user" | "assistant";
};

export type ToolMessage = {
  id: string;
  role: "tool";
  content: ReactNode;
};

export type Message = TextMessage | ToolMessage;

export interface ChatProps {
  messages: Message[];
  components?: Components;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  bottomContent?: ReactNode;
}

export const Chat: FC<ChatProps> = ({
  messages,
  components,
  onSubmit,
  input,
  handleInputChange,
  isLoading,
  bottomContent,
}) => {
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  return (
    <div className={styles.chatContainer}>
      <div ref={messageListRef} className={styles.messageList}>
        {messages.map((message) =>
          message.role === "user" || message.role === "assistant" ? (
            <div
              key={message.id}
              className={`${styles.message} ${styles[message.role]}`}
            >
              <ReactMarkdown
                components={components}
                className={styles.messageText}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div
              key={message.id}
              className={`${styles.message} ${styles.toolCall}`}
            >
              {message.content}
            </div>
          )
        )}
      </div>
      <form onSubmit={onSubmit} className={styles.form}>
        <Textarea
          ref={inputRef}
          autoFocus
          placeholder="Type a message..."
          variant="clear"
          disableResize
          className={styles.input}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim() !== "") {
                const formEvent =
                  e as unknown as React.FormEvent<HTMLFormElement>;
                onSubmit?.(formEvent);
              }
            }
          }}
          rows={1}
          name="message"
          disabled={isLoading}
        />
        <div className={styles.sendButtonContainer}>
          {bottomContent}
          <Button
            type="submit"
            className={styles.sendButton}
            disabled={isLoading}
            size="icon"
          >
            <SendIcon />
          </Button>
        </div>
      </form>
    </div>
  );
};
