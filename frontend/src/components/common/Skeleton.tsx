interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  variant?: 'text' | 'rectangular' | 'circular'
}

export function Skeleton({ className = '', width, height, variant = 'text' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'

  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-full',
    circular: 'rounded-full'
  }

  const style = {
    width: width || '100%',
    height: height || undefined,
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton width="200px" height="32px" className="mb-2" />
        <Skeleton width="300px" height="20px" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Quick Expense & Risk */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Expense Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <Skeleton width="150px" height="24px" className="mb-3" />
            <div className="space-y-3">
              <Skeleton height="48px" />
              <Skeleton height="40px" />
              <Skeleton height="40px" />
              <Skeleton height="48px" />
            </div>
          </div>

          {/* Risk Indicator Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <Skeleton width="120px" height="24px" className="mb-3" />
            <div className="flex flex-col items-center py-4">
              <Skeleton variant="circular" width="80px" height="80px" className="mb-3" />
              <Skeleton width="150px" height="20px" className="mb-2" />
              <Skeleton width="200px" height="16px" />
            </div>
          </div>
        </div>

        {/* Right column - Budget Summary & Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Summary Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <Skeleton width="180px" height="24px" className="mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton width="100px" height="14px" className="mb-2 mx-auto" />
                  <Skeleton width="120px" height="28px" className="mx-auto" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Expenses Skeleton */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <Skeleton width="150px" height="24px" className="mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton variant="circular" width="40px" height="40px" />
                      <div className="flex-1">
                        <Skeleton width="120px" height="16px" className="mb-1" />
                        <Skeleton width="80px" height="12px" />
                      </div>
                    </div>
                    <Skeleton width="60px" height="20px" />
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown Skeleton */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <Skeleton width="180px" height="24px" className="mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <Skeleton width="100px" height="16px" />
                      <Skeleton width="60px" height="16px" />
                    </div>
                    <Skeleton height="8px" className="rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ExpenseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circular" width="40px" height="40px" />
            <div className="flex-1">
              <Skeleton width="140px" height="18px" className="mb-1" />
              <Skeleton width="100px" height="14px" />
            </div>
          </div>
          <Skeleton width="70px" height="20px" />
        </div>
      ))}
    </div>
  )
}
