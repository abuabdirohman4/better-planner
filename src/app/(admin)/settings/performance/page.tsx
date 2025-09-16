"use client";

import { useState, useEffect, useCallback } from 'react';

import { getPerformanceMetrics, getPerformanceSummary, exportPerformanceMetrics, clearPerformanceMetrics, setPerformanceMonitoringEnabled, isPerformanceMonitoringEnabled } from '@/lib/performanceUtils';
import type { PerformanceMetrics } from '@/lib/performanceUtils';


// Performance Summary Component
function PerformanceSummary({ summary }: { summary: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Page Views</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPageViews}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Load Time</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.averageLoadTime.toFixed(2)}ms</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Cache Hit Rate</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.averageCacheHitRate.toFixed(1)}%</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Memory Usage</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.averageMemoryUsage.toFixed(1)}MB</p>
      </div>
    </div>
  );
}

// Performance Metrics Table Component
function PerformanceMetricsTable({ metrics }: { metrics: PerformanceMetrics[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Performance Metrics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Page</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Environment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Load Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cache Hit Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Memory Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {metrics.map((metric) => (
              <tr key={`${metric.pageName}-${metric.timestamp}-${metric.loadTime}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{metric.pageName}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{metric.environment}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{metric.loadTime.toFixed(2)}ms</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{metric.cacheHitRate.toFixed(1)}%</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{metric.memoryUsage.toFixed(1)}MB</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(metric.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Performance Dashboard Page
 * Displays performance metrics and analytics for Better Planner
 */
export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [summary, setSummary] = useState(getPerformanceSummary());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState<'all' | 'development' | 'production'>('all');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(isPerformanceMonitoringEnabled());

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load from localStorage first
      const localMetrics = getPerformanceMetrics();
      
      // Filter by environment
      const filteredMetrics = selectedEnvironment === 'all' 
        ? localMetrics 
        : localMetrics.filter(m => m.environment === selectedEnvironment);
      
      // Filter by page
      const pageFilteredMetrics = selectedPage === 'all'
        ? filteredMetrics
        : filteredMetrics.filter(m => m.pageName === selectedPage);
      
      // Filter by time range
      const timeFilteredMetrics = filterByTimeRange(pageFilteredMetrics, timeRange);
      
      setMetrics(timeFilteredMetrics);
      setSummary(getPerformanceSummary());
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEnvironment, selectedPage, timeRange]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleToggleMonitoring = () => {
    const newState = !isMonitoringEnabled;
    setIsMonitoringEnabled(newState);
    setPerformanceMonitoringEnabled(newState);
    
    // Show feedback to user via console (for now)
    if (newState) {
      console.warn('Performance monitoring enabled! Data will be collected from now on.');
    } else {
      console.warn('Performance monitoring disabled! No new data will be collected.');
    }
  };

  const filterByTimeRange = (data: PerformanceMetrics[], range: string) => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (range) {
      case 'today':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(m => new Date(m.timestamp) >= cutoff);
  };

  const handleExport = () => {
    const data = exportPerformanceMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `better-planner-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    // eslint-disable-next-line no-alert
    if (confirm('Are you sure you want to clear all performance data? This action cannot be undone.')) {
      clearPerformanceMetrics();
      setMetrics([]);
      setSummary(getPerformanceSummary());
    }
  };

  const getPageNames = () => {
    const pages = [...new Set(metrics.map(m => m.pageName))];
    return pages.sort();
  };

  // const getEnvironments = () => {
  //   const envs = [...new Set(metrics.map(m => m.environment))];
  //   return envs.sort();
  // };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Performance Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor and analyze Better Planner performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${isMonitoringEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {isMonitoringEnabled ? 'Monitoring ON' : 'Monitoring OFF'}
                </span>
                <button
                  onClick={handleToggleMonitoring}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isMonitoringEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isMonitoringEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <PerformanceSummary summary={summary} />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Environment
              </label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value as 'all' | 'development' | 'production')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Environments</option>
                <option value="development">Development</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Page
              </label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Pages</option>
                {getPageNames().map(page => (
                  <option key={page} value={page}>{page}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Export Data
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Data
            </button>
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Performance Table */}
        <PerformanceMetricsTable metrics={metrics} />
      </div>
    </div>
  );
}
