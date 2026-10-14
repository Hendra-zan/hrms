import React from 'react';
import { useFloatingChatState } from './useFloatingChatState.ts';
import { getWidgetSizeClass } from './types.ts';
import { FloatingChatHeader } from './FloatingChatHeader.tsx';
import { FloatingChatContactList } from './FloatingChatContactList.tsx';
import { FloatingChatMessageArea } from './FloatingChatMessageArea.tsx';
import { FloatingChatSettingsModal } from './FloatingChatSettingsModal.tsx';

export const FloatingChatWidget: React.FC = () => {
  const state = useFloatingChatState();

  if (!state.authUser) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {state.isOpen && (
        <div
          className={`mb-3 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-slideUp relative ${getWidgetSizeClass(state.widgetSize)}`}
        >
          <FloatingChatHeader
            selectedPartner={state.selectedPartner}
            setSelectedPartner={state.setSelectedPartner}
            setIsOpen={state.setIsOpen}
            showSettings={state.showSettings}
            setShowSettings={state.setShowSettings}
            isSearchingChat={state.isSearchingChat}
            setIsSearchingChat={state.setIsSearchingChat}
            setChatSearchQuery={state.setChatSearchQuery}
            isDeletingConversation={state.isDeletingConversation}
            handleDeleteConversation={state.handleDeleteConversation}
            getOnlineStatus={state.getOnlineStatus}
          />

          <FloatingChatSettingsModal
            showSettings={state.showSettings}
            setShowSettings={state.setShowSettings}
            fontSize={state.fontSize}
            setFontSize={state.setFontSize}
            widgetSize={state.widgetSize}
            setWidgetSize={state.setWidgetSize}
          />

          {state.selectedPartner ? (
            <FloatingChatMessageArea
              messages={state.messages}
              loading={state.loading}
              authUser={state.authUser}
              fontSize={state.fontSize}
              chatSearchQuery={state.chatSearchQuery}
              isSearchingChat={state.isSearchingChat}
              setChatSearchQuery={state.setChatSearchQuery}
              inputText={state.inputText}
              setInputText={state.setInputText}
              handleSend={state.handleSend}
              handleFileUpload={state.handleFileUpload}
              isUploading={state.isUploading}
              fileInputRef={state.fileInputRef}
              chatEndRef={state.chatEndRef}
            />
          ) : (
            <FloatingChatContactList
              searchTerm={state.searchTerm}
              setSearchTerm={state.setSearchTerm}
              loadingContacts={state.loadingContacts}
              filteredEmployees={state.filteredEmployees}
              unreadCounts={state.unreadCounts}
              setSelectedPartner={state.setSelectedPartner}
              getOnlineStatus={state.getOnlineStatus}
            />
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => state.setIsOpen(prev => !prev)}
        className="w-14 h-14 bg-gradient-to-tr from-[#06736a] to-teal-500 hover:from-[#055b54] hover:to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center relative focus:outline-none focus:ring-4 focus:ring-teal-500/30"
      >
        {state.isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}

        {!state.isOpen && state.totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
            {state.totalUnread > 99 ? '99+' : state.totalUnread}
          </span>
        )}
      </button>
    </div>
  );
};
