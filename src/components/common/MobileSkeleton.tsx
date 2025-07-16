import React from "react";

/**
 * Mobile-optimized skeleton loading component
 * Provides better UX for mobile users with progressive loading
 */

interface MobileSkeletonProps {
  variant?: 'weekly-sync' | 'weekly-goals' | 'to-dont-list' | 'task-list' | 'generic';
  className?: string;
}

// Individual skeleton components
const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

const SkeletonText = ({ width = "100%", height = "1rem" }: { width?: string; height?: string }) => (
  <div 
    className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded"
    style={{ width, height }}
  />
);

const SkeletonCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`border rounded-lg p-4 bg-white dark:bg-gray-800 ${className}`}>
    {children}
  </div>
);

// Weekly Goals Table Skeleton
const WeeklyGoalsSkeleton = () => (
  <SkeletonCard className="mb-6">
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <SkeletonText width="60%" height="1.5rem" />
      </div>
      
      {/* Goals Table */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <SkeletonText width="30%" height="1.25rem" />
              <SkeletonText width="20%" height="1rem" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <SkeletonBlock className="w-4 h-4" />
                  <SkeletonText width="70%" height="1rem" />
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between items-center">
                <SkeletonText width="25%" height="0.875rem" />
                <SkeletonText width="15%" height="0.875rem" />
              </div>
              <SkeletonBlock className="w-full h-2 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </SkeletonCard>
);

// To Don't List Skeleton
const ToDontListSkeleton = () => (
  <SkeletonCard className="mb-6">
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <SkeletonText width="40%" height="1.5rem" />
      </div>
      
      {/* Rules List */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonText width="2rem" height="1rem" />
            <SkeletonText width="80%" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  </SkeletonCard>
);

// Task List Skeleton
const TaskListSkeleton = () => (
  <div className="space-y-6">
    {/* Unscheduled Tasks */}
    <SkeletonCard>
      <div className="space-y-4">
        <SkeletonText width="50%" height="1.25rem" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border rounded">
              <SkeletonText width="75%" height="1rem" />
              <SkeletonText width="40%" height="0.875rem" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
    
    {/* Scheduled Tasks */}
    <SkeletonCard>
      <div className="space-y-4">
        <SkeletonText width="40%" height="1.25rem" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded p-3">
              <SkeletonText width="60%" height="1rem" />
              <div className="space-y-2 mt-2">
                {[1, 2].map((j) => (
                  <div key={j} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <SkeletonText width="80%" height="1rem" />
                    <SkeletonText width="30%" height="0.875rem" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  </div>
);

// Generic Skeleton
const GenericSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <SkeletonCard key={i}>
        <div className="space-y-4">
          <SkeletonText width="60%" height="1.5rem" />
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <SkeletonText key={j} width="80%" height="1rem" />
            ))}
          </div>
        </div>
      </SkeletonCard>
    ))}
  </div>
);

// Main Mobile Skeleton Component
export default function MobileSkeleton({ variant = 'generic', className = "" }: MobileSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'weekly-sync':
        return (
          <div className={`space-y-6 ${className}`}>
            <WeeklyGoalsSkeleton />
            <ToDontListSkeleton />
            <TaskListSkeleton />
          </div>
        );
      case 'weekly-goals':
        return <WeeklyGoalsSkeleton />;
      case 'to-dont-list':
        return <ToDontListSkeleton />;
      case 'task-list':
        return <TaskListSkeleton />;
      default:
        return <GenericSkeleton />;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {renderSkeleton()}
    </div>
  );
}

// Progressive Loading Message Component
export function ProgressiveLoadingMessage({ 
  stage, 
  isMobile = false 
}: { 
  stage: 'initializing' | 'loading-goals' | 'loading-tasks' | 'optimizing' | 'complete';
  isMobile?: boolean;
}) {
  const messages = {
    initializing: isMobile ? 'Preparing mobile experience...' : 'Initializing...',
    'loading-goals': 'Loading weekly goals...',
    'loading-tasks': 'Loading tasks...',
    optimizing: isMobile ? 'Optimizing for mobile...' : 'Finalizing...',
    complete: 'Ready!',
  };

  const progress = {
    initializing: 20,
    'loading-goals': 40,
    'loading-tasks': 60,
    optimizing: 80,
    complete: 100,
  };

  return (
    <div className="text-center space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {messages[stage]}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress[stage]}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {progress[stage]}% complete
      </div>
    </div>
  );
} 