/* eslint-disable @typescript-eslint/no-unused-vars */
// The AIConsole Project
//
// Copyright 2023 10Clouds
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ProjectModalMode, useProjectFileManagerStore } from '@/store/projects/useProjectFileManagerStore';
import { useRecentProjectsStore } from '@/store/projects/useRecentProjectsStore';
import { ContextMenuItems } from '@/types/common/contextMenu';
import { RecentProject } from '@/types/projects/RecentProject';
import { cn } from '@/utils/common/cn';
import {
  AlertTriangle,
  Blocks,
  LocateFixed,
  LucideIcon,
  MessageSquare,
  MoreVertical,
  ScanText,
  StickyNote,
  Trash,
} from 'lucide-react';
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projects/useProjectStore';
import { ContextMenu, ContextMenuRef } from '../common/ContextMenu';
import Tooltip from '../common/Tooltip';
import { Icon } from '../common/icons/Icon';
import { ActorAvatar } from '../editables/chat/ActorAvatar';
import { Spinner } from '../editables/chat/Spinner';

const MAX_CHATS_TO_DISPLAY = 3;
interface CounterItemProps {
  icon: LucideIcon;
  count: number;
  className?: string;
}

const CounterItem = ({ icon, count, className }: CounterItemProps) => (
  <div className="flex items-center gap-[10px] text-gray-300 text-[15px]">
    <Icon icon={icon} className={cn('text-orange', className)} />
    {count}
  </div>
);

export type ProjectCardProps = Omit<RecentProject, 'recent_chats' | 'incorrect_path'> & {
  recentChats: string[];
  incorrectPath: boolean;
};

export function ProjectCard({ name, path, recentChats, incorrectPath, stats }: ProjectCardProps) {
  const chooseProject = useProjectStore((state) => state.chooseProject);
  const removeRecentProject = useRecentProjectsStore((state) => state.removeRecentProject);
  const [isShowingContext, setIsShowingContext] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProjectSwitchFetching = useProjectStore((state) => state.isProjectSwitchFetching);
  const [isCurrentProjectFetching, setIsCurrentProjectFetching] = useState(false);
  const projectModalMode = useProjectFileManagerStore((state) => state.projectModalMode);
  const reloadProjects = useRecentProjectsStore((state) => state.getRecentProjects);
  const resetFetching = useProjectStore((state) => state.resetProjectSwitchFetching);
  const openModal = useProjectFileManagerStore((state) => state.openModal);

  const { chats_count, materials_dynamic_note_count, materials_note_count, materials_python_api_count, agents } =
    stats;

  const deleteProject = useCallback(async () => {
    await removeRecentProject(path);
  }, [path, removeRecentProject]);

  const goToProjectChat = (event: MouseEvent) => {
    const isFocused = inputRef.current === document.activeElement;
    if (isFocused || isProjectSwitchFetching) return;

    if (!isEditing && !isFocused && event.button === 0) {
      chooseProject(path)
        .then(() =>
          // set timeout to prevent flickering
          setTimeout(() => {
            setIsCurrentProjectFetching(true);
          }, 0),
        )
        .catch(() => {
          setIsCurrentProjectFetching(false);
          reloadProjects();
          resetFetching();
          openModal(ProjectModalMode.LOCATE, path, name);
        });
    }
  };

  const triggerRef = useRef<ContextMenuRef>(null);

  const handleMoreIconClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (triggerRef.current) {
      triggerRef?.current.handleTriggerClick(event);
    }
  };

  const handleOpenContextChange = (open: boolean) => {
    setIsShowingContext(open);
  };

  useEffect(() => {
    if (isEditing) {
      setInputText(name); // Reset input text to the current object name
      inputRef.current?.select(); // Select the text in the input
    }
  }, [isEditing, name]);

  const handleRename = useCallback(async () => {
    if (inputText.trim() && inputText !== name) {
      // put here rename logic when backend ready
    }
    setIsEditing(false);
  }, [inputText, name]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setInputText(name);
      setIsEditing(false);
    } else if (event.key === 'Enter') {
      handleRename(); // Commit the change
    }
  };

  // TODO: add duplicate logic and hide logic
  const contextMenuItems: ContextMenuItems = useMemo(
    () => [
      // {
      //   type: 'item',
      //   icon: Edit,
      //   title: 'Rename',
      //   action: () => setIsEditing(true),
      // },
      // {
      //   type: 'item',
      //   icon: Copy,
      //   title: 'Duplicate',
      //   action: () => {},
      // },
      // { type: 'separator', key: 'hide-separator' },
      // {
      //   type: 'item',
      //   icon: EyeOff,
      //   title: 'Hide recent',
      //   action: () => {},
      // },
      // { type: 'separator', key: 'delete-separator' },
      {
        type: 'item',
        icon: Trash,
        title: 'Delete',
        action: deleteProject,
      },
    ],
    [deleteProject],
  );

  const contextMenuItemsIncorrectPath: ContextMenuItems = useMemo(
    () => [
      {
        type: 'item',
        icon: LocateFixed,
        title: 'Locate',
        action: () => openModal(ProjectModalMode.LOCATE, path, name),
      },
      {
        type: 'item',
        icon: Trash,
        title: 'Delete',
        action: () => openModal(ProjectModalMode.DELETE, path, name),
      },
    ],
    [name, openModal, path],
  );

  return (
    <ContextMenu
      options={incorrectPath ? contextMenuItemsIncorrectPath : contextMenuItems}
      ref={triggerRef}
      onOpenChange={handleOpenContextChange}
    >
      <div
        className={cn(
          'border-2 border-gray-600 p-[30px] pb-[20px] rounded-[20px] w-full transition-bg duration-150  cursor-pointer bg-gray-900 hover:bg-project-item-gradient flex flex-col justify-between relative',
          {
            'bg-project-item-gradient': isShowingContext,
            'opacity-50 hover:bg-gray-900 cursor-default': isProjectSwitchFetching,
            group: !isProjectSwitchFetching,
            'opacity-50': incorrectPath,
          },
        )}
        onMouseDown={incorrectPath ? () => openModal(ProjectModalMode.LOCATE, path, name) : goToProjectChat}
      >
        <div className="flex flex-row items-center w-full mb-[15px]">
          <div className="flex-grow align-left h-[40px]">
            {isEditing ? (
              <input
                className="outline-none h-full border border-gray-500 rounded-[4px] w-full bg-transparent px-[10px] py-[5px] text-white text-[22px] font-black"
                value={inputText}
                ref={inputRef}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                onChange={(e) => setInputText(e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-[10px]">
                {incorrectPath && (
                  <Tooltip
                    label="We can't find the project"
                    position="top"
                    align="center"
                    sideOffset={10}
                    disableAnimation
                    withArrow
                  >
                    <div>
                      <Icon icon={AlertTriangle} width={24} height={24} className="text-gray-400" />
                    </div>
                  </Tooltip>
                )}
                <h3
                  className={cn(
                    'text-[22px] font-black transition-colors text-gray-400  group-hover:text-white duration-150',
                    {
                      'text-white': isShowingContext,
                    },
                  )}
                >
                  {name}
                </h3>
              </div>
            )}
          </div>

          {!isEditing ? (
            <Icon
              icon={MoreVertical}
              className={cn('min-h-[16px] min-w-[16px] ml-auto hidden group-hover:text-white group-hover:block', {
                block: isShowingContext,
              })}
              width={20}
              height={20}
              onMouseDown={handleMoreIconClick}
            />
          ) : null}
        </div>
        <div className="relative flex flex-col gap-2.5 h-[87px]">
          <div
            className={cn(
              'bg-project-item-gradient-2  w-[calc(100%+40px)] absolute -left-[20px] -right-[20px] top-0 bottom-[-5px] z-10 group-hover:hidden',
              {
                hidden: isShowingContext || projectModalMode !== ProjectModalMode.CLOSED,
              },
            )}
          />
          {recentChats?.map((command, index) =>
            index < MAX_CHATS_TO_DISPLAY ? (
              <div key={index} className="flex flex-row items-center gap-2 text-white text-[15px]">
                <div className="flex-grow truncate">{command} </div>
              </div>
            ) : null,
          )}
        </div>

        <div className="flex gap-2 justify-between w-full mt-[15px] mb-0">
          {chats_count ? <CounterItem icon={MessageSquare} count={chats_count} className="text-purple-400" /> : null}
          {materials_note_count ? <CounterItem icon={StickyNote} count={materials_note_count} /> : null}
          {materials_dynamic_note_count ? <CounterItem icon={ScanText} count={materials_dynamic_note_count} /> : null}
          {materials_python_api_count ? <CounterItem icon={Blocks} count={materials_python_api_count} /> : null}
          {agents.count ? (
            <div className="flex items-center text-[15px] text-gray-300">
              <ActorAvatar actorType="agent" actorId={agents.agent_ids[0] || '1'} type="extraSmall" className="mb-0" />
              <ActorAvatar
                actorType="agent"
                actorId={agents.agent_ids[1] || '2'}
                type="extraSmall"
                className="relative -left-[12px] mb-0"
              />
              <span className="-ml-[2px]">{agents.count}</span>
            </div>
          ) : null}
        </div>

        {isCurrentProjectFetching && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 z-30">
            <Spinner />
          </div>
        )}
      </div>
    </ContextMenu>
  );
}
