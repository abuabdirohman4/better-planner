import { writeFile, mkdir, readFile, unlink, readdir } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';

import type { PerformanceMetrics } from '@/lib/performanceUtils';

/**
 * API endpoint for storing performance metrics
 * Saves metrics to local file system for analysis
 */
export async function POST(request: NextRequest) {
  try {
    const metrics: PerformanceMetrics = await request.json();
    
    // Validate required fields
    if (!metrics.pageName || !metrics.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: pageName, timestamp' },
        { status: 400 }
      );
    }

    // Create performance data directory if it doesn't exist
    const performanceDir = join(process.cwd(), 'data', 'performance');
    await mkdir(performanceDir, { recursive: true });

    // Generate filename based on date and environment
    const date = new Date(metrics.timestamp);
    const dateStr = date.toISOString().split('T')[0];
    const filename = `performance-${metrics.environment}-${dateStr}.json`;

    // Read existing data
    let existingData: PerformanceMetrics[] = [];
    try {
      const filePath = join(performanceDir, filename);
      const fileContent = await readFile(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    } catch {
      // File doesn't exist yet, start with empty array
    }

    // Add new metrics
    existingData.push(metrics);

    // Save to file
    const filePath = join(performanceDir, filename);
    await writeFile(filePath, JSON.stringify(existingData, null, 2));

    // Also save to a combined file for easier analysis
    const combinedPath = join(performanceDir, 'performance-combined.json');
    let combinedData: PerformanceMetrics[] = [];
    try {
      const combinedContent = await readFile(combinedPath, 'utf-8');
      combinedData = JSON.parse(combinedContent);
    } catch {
      // File doesn't exist yet
    }
    
    combinedData.push(metrics);
    
    // Keep only last 1000 entries to prevent file from growing too large
    if (combinedData.length > 1000) {
      combinedData = combinedData.slice(-1000);
    }
    
    await writeFile(combinedPath, JSON.stringify(combinedData, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'Performance metrics saved successfully',
      filename,
      totalEntries: existingData.length
    });

  } catch (error) {
    console.error('Error saving performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to save performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for retrieving performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment') || 'all';
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '100');

    const performanceDir = join(process.cwd(), 'data', 'performance');
    
    let data: PerformanceMetrics[] = [];

    if (date) {
      // Get specific date file
      const filename = `performance-${environment}-${date}.json`;
      const filePath = join(performanceDir, filename);
      
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        data = JSON.parse(fileContent);
      } catch {
        return NextResponse.json({ data: [] });
      }
    } else {
      // Get combined data
      const combinedPath = join(performanceDir, 'performance-combined.json');
      
      try {
        const fileContent = await readFile(combinedPath, 'utf-8');
        data = JSON.parse(fileContent);
      } catch {
        return NextResponse.json({ data: [] });
      }
    }

    // Filter by environment if specified
    if (environment !== 'all') {
      data = data.filter(metric => metric.environment === environment);
    }

    // Limit results
    data = data.slice(-limit);

    // Calculate summary statistics
    const summary = {
      totalEntries: data.length,
      averageLoadTime: data.reduce((sum, m) => sum + m.loadTime, 0) / data.length || 0,
      averageCacheHitRate: data.reduce((sum, m) => sum + m.cacheHitRate, 0) / data.length || 0,
      averageNetworkRequests: data.reduce((sum, m) => sum + m.networkRequests, 0) / data.length || 0,
      averageCacheSize: data.reduce((sum, m) => sum + m.swrCacheSize, 0) / data.length || 0,
      environments: [...new Set(data.map(m => m.environment))],
      pageNames: [...new Set(data.map(m => m.pageName))],
    };

    return NextResponse.json({ 
      data, 
      summary,
      filters: { environment, date, limit }
    });

  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint for clearing performance data
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment') || 'all';
    const date = searchParams.get('date');

    const performanceDir = join(process.cwd(), 'data', 'performance');

    if (date) {
      // Delete specific date file
      const filename = `performance-${environment}-${date}.json`;
      const filePath = join(performanceDir, filename);
      
      try {
        await unlink(filePath);
      } catch {
        // File doesn't exist, that's fine
      }
    } else {
      // Delete all files
      try {
        const files = await readdir(performanceDir);
        for (const file of files) {
          if (file.startsWith('performance-') && file.endsWith('.json')) {
            await unlink(join(performanceDir, file));
          }
        }
      } catch {
        // Directory doesn't exist, that's fine
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Performance data cleared successfully' 
    });

  } catch (error) {
    console.error('Error clearing performance data:', error);
    return NextResponse.json(
      { error: 'Failed to clear performance data' },
      { status: 500 }
    );
  }
}
