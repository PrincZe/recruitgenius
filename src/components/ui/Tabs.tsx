'use client';

import * as React from 'react';

export interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContextValue {
  selectedTab: string;
  setSelectedTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export function Tabs({ defaultValue, children, className = '' }: TabsProps) {
  const [selectedTab, setSelectedTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`flex ${className}`}>
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TabsTrigger({ value, children, className = '', onClick }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }

  const { selectedTab, setSelectedTab } = context;
  const isSelected = selectedTab === value;

  const handleClick = () => {
    setSelectedTab(value);
    if (onClick) onClick();
  };

  return (
    <button
      type="button"
      className={`${className} flex items-center`}
      onClick={handleClick}
      data-state={isSelected ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }

  const { selectedTab } = context;
  const isSelected = selectedTab === value;

  if (!isSelected) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
} 