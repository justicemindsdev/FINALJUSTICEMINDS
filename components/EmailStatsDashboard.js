import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Component } from './Pie';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export default function EmailStatsDashboard({ email, csvData }) {
  // Parse CSV data for the specific contact
  const contactStats = useMemo(() => {
    if (!csvData || !email) return null;
    return parseContactStats(csvData, email);
  }, [csvData, email]);

  // Parse CSV data for the domain
  const domainStats = useMemo(() => {
    if (!csvData || !email) return null;
    const domain = email.split('@')[1];
    return parseDomainStats(csvData, domain);
  }, [csvData, email]);

  if (!contactStats || !domainStats) {
    return <div className="text-center p-4">Loading statistics...</div>;
  }

  // Calculate month-over-month changes (mock data for demo)
  const mockChanges = {
    totalEmails: 12.5,
    openRate: 3.2,
    clickRate: -1.8,
    conversionRate: 0.7
  };

  return (
    <div className="mt-6 bg-[#0c0c1d] p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            <span className="text-[#5d5fef]">Dashboard</span> <span className="text-[#4ade80]">Overview</span>
          </h2>
          <p className="text-gray-400 mt-1">Track and optimize your email performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total Emails */}
        <Card className="bg-[#131326] border-[#1d1d3d] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-1">TOTAL EMAILS</p>
                <h3 className="text-3xl font-bold text-white">{contactStats.pieData.total}</h3>
                <div className="flex items-center mt-2">
                  <span className={`text-xs ${mockChanges.totalEmails >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                    {mockChanges.totalEmails >= 0 ? '↑' : '↓'} {Math.abs(mockChanges.totalEmails)}%
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="bg-[#1d1d3d] p-2 rounded-full">
                <svg className="w-5 h-5 text-[#5d5fef]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Rate */}
        <Card className="bg-[#131326] border-[#1d1d3d] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-1">OPEN RATE</p>
                <h3 className="text-3xl font-bold text-[#4ade80]">{Math.min(contactStats.openRate, 100)}%</h3>
                <div className="flex items-center mt-2">
                  <span className={`text-xs ${mockChanges.openRate >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                    {mockChanges.openRate >= 0 ? '↑' : '↓'} {Math.abs(mockChanges.openRate)}%
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
                </div>
                {contactStats.openRate > 100 && (
                  <p className="text-xs text-gray-400 mt-1">Multiple opens detected ({contactStats.openRate}% total)</p>
                )}
              </div>
              <div className="bg-[#1d1d3d] p-2 rounded-full">
                <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Click Rate */}
        <Card className="bg-[#131326] border-[#1d1d3d] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-1">CLICK RATE</p>
                <h3 className="text-3xl font-bold text-[#60a5fa]">{contactStats.clickRate}%</h3>
                <div className="flex items-center mt-2">
                  <span className={`text-xs ${mockChanges.clickRate >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                    {mockChanges.clickRate >= 0 ? '↑' : '↓'} {Math.abs(mockChanges.clickRate)}%
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="bg-[#1d1d3d] p-2 rounded-full">
                <svg className="w-5 h-5 text-[#60a5fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card className="bg-[#131326] border-[#1d1d3d] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-1">AVG RESPONSE</p>
                <h3 className="text-3xl font-bold text-[#c084fc]">{contactStats.avgResponseTime} mins</h3>
                <div className="flex items-center mt-2">
                  <span className={`text-xs ${contactStats.avgResponseTime < 30 ? 'text-green-400' : 'text-yellow-400'} flex items-center`}>
                    {contactStats.avgResponseTime < 30 ? 'Fast' : contactStats.avgResponseTime < 120 ? 'Average' : 'Slow'}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">response time</span>
                </div>
              </div>
              <div className="bg-[#1d1d3d] p-2 rounded-full">
                <svg className="w-5 h-5 text-[#c084fc]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Status Breakdown */}
        <Card className="bg-[#131326] border-[#1d1d3d] overflow-hidden">
          <CardHeader className="p-6 pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Email Status Breakdown</CardTitle>
              <div className="bg-[#1d1d3d] px-3 py-1 rounded-md flex items-center">
                <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-xs text-gray-400">CSV</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex">
              <div className="w-1/2">
                <div className="w-full max-w-[300px] h-[200px] mx-auto">
                  <Component stats={contactStats.pieData} />
                </div>
              </div>
              <div className="w-1/2">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#4ade80] mr-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Received</span>
                        <span className="text-sm font-semibold">{contactStats.pieData.received}</span>
                      </div>
                      <div className="w-full bg-[#1d1d3d] h-1.5 rounded-full mt-1">
                        <div className="bg-[#4ade80] h-1.5 rounded-full" style={{ width: `${(contactStats.pieData.received / contactStats.pieData.total) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b] mr-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Sent</span>
                        <span className="text-sm font-semibold">{contactStats.pieData.sent}</span>
                      </div>
                      <div className="w-full bg-[#1d1d3d] h-1.5 rounded-full mt-1">
                        <div className="bg-[#f59e0b] h-1.5 rounded-full" style={{ width: `${(contactStats.pieData.sent / contactStats.pieData.total) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444] mr-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Unopened</span>
                        <span className="text-sm font-semibold">{contactStats.totalOpens < contactStats.pieData.total ? contactStats.pieData.total - contactStats.totalOpens : 0}</span>
                      </div>
                      <div className="w-full bg-[#1d1d3d] h-1.5 rounded-full mt-1">
                        <div className="bg-[#ef4444] h-1.5 rounded-full" style={{ width: `${contactStats.totalOpens < contactStats.pieData.total ? ((contactStats.pieData.total - contactStats.totalOpens) / contactStats.pieData.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain Analysis */}
        <Card className="bg-[#131326] border-[#1d1d3d] overflow-hidden">
          <CardHeader className="p-6 pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Domain Analysis: {email.split('@')[1]}</CardTitle>
              <div className="flex space-x-2">
                <div className="bg-[#1d1d3d] px-3 py-1 rounded-md flex items-center">
                  <span className="text-xs text-gray-400">Last 7 days</span>
                  <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="bg-[#1d1d3d] px-3 py-1 rounded-md flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-xs text-gray-400">CSV</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="w-full h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={domainStats.responseTimeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d3d" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1d1d3d', border: 'none', borderRadius: '4px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="responseTime" name="Avg. Response Time (mins)" fill="#c084fc" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-[#1d1d3d] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-300">Domain Avg. Response</p>
                    <div className="group relative">
                      <InfoCircledIcon className="h-4 w-4 text-gray-400" />
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[#131326] p-2 rounded text-xs w-48 z-10">
                        Average response time across all contacts in this domain.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <p className="text-2xl font-bold text-white">{domainStats.avgResponseTime}</p>
                    <p className="text-sm text-gray-400 ml-1 mb-1">mins</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {domainStats.avgResponseTime < 30 ? 'Fast domain response' : 
                     domainStats.avgResponseTime < 120 ? 'Average domain response' : 
                     'Slow domain response'}
                  </p>
                </div>
                <div className="bg-[#1d1d3d] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-300">Domain Open Rate</p>
                    <div className="group relative">
                      <InfoCircledIcon className="h-4 w-4 text-gray-400" />
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[#131326] p-2 rounded text-xs w-48 z-10">
                        Average open rate across all contacts in this domain.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <p className="text-2xl font-bold text-[#4ade80]">{Math.min(domainStats.openRate, 100)}</p>
                    <p className="text-sm text-gray-400 ml-1 mb-1">%</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {domainStats.openRate > 100 ? `High engagement (${domainStats.openRate}% total opens)` : 
                     domainStats.openRate > 50 ? 'Good domain engagement' : 
                     'Low domain engagement'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to parse CSV data for a specific contact
function parseContactStats(csvData, email) {
  // Parse the CSV data
  const rows = csvData.split('\n')
    .filter(row => row.trim())
    .map(row => {
      const columns = row.split(',');
      // Handle quoted fields that might contain commas
      const processedColumns = [];
      let inQuote = false;
      let currentField = '';
      
      for (let i = 0; i < columns.length; i++) {
        const field = columns[i];
        
        if (field.startsWith('"') && !field.endsWith('"')) {
          // Start of a quoted field
          inQuote = true;
          currentField = field.substring(1);
        } else if (inQuote && field.endsWith('"')) {
          // End of a quoted field
          inQuote = false;
          currentField += ',' + field.substring(0, field.length - 1);
          processedColumns.push(currentField);
          currentField = '';
        } else if (inQuote) {
          // Middle of a quoted field
          currentField += ',' + field;
        } else {
          // Regular field
          processedColumns.push(field.replace(/^"|"$/g, ''));
        }
      }
      
      return processedColumns;
    });

  // Skip header row
  const dataRows = rows.slice(1);
  
  // Filter rows related to the specific contact
  const contactRows = dataRows.filter(row => {
    const recipient = row[0] || '';
    return recipient.includes(email);
  });
  
  // Calculate statistics
  const totalMessages = contactRows.length;
  const received = contactRows.filter(row => row[0].includes(email)).length;
  const sent = totalMessages - received;
  
  // Calculate response time (if available)
  let totalResponseTime = 0;
  let responseCount = 0;
  
  contactRows.forEach(row => {
    const responseTime = parseFloat(row[6] || '0');
    if (responseTime > 0) {
      totalResponseTime += responseTime;
      responseCount++;
    }
  });
  
  const avgResponseTime = responseCount > 0 
    ? Math.round(totalResponseTime / responseCount) 
    : 0;
  
  // Calculate open and click rates
  const openCount = contactRows.reduce((sum, row) => sum + parseInt(row[3] || '0'), 0);
  const clickCount = contactRows.reduce((sum, row) => sum + parseInt(row[4] || '0'), 0);
  
  const openRate = totalMessages > 0 
    ? Math.round((openCount / totalMessages) * 100) 
    : 0;
  
  const clickRate = openCount > 0 
    ? Math.round((clickCount / openCount) * 100) 
    : 0;
  
  // Get last response date
  const lastResponse = contactRows.length > 0 
    ? contactRows[0][2] // Assuming the data is sorted by date
    : 'N/A';
  
  return {
    pieData: {
      received,
      sent,
      total: totalMessages
    },
    avgResponseTime,
    openRate,
    clickRate,
    lastResponse,
    // Add more detailed statistics for better visualization
    totalOpens: openCount,
    totalClicks: clickCount,
    messagesWithResponse: responseCount
  };
}

// Helper function to parse CSV data for a domain
function parseDomainStats(csvData, domain) {
  // Parse the CSV data
  const rows = csvData.split('\n')
    .filter(row => row.trim())
    .map(row => {
      const columns = row.split(',');
      // Handle quoted fields that might contain commas
      const processedColumns = [];
      let inQuote = false;
      let currentField = '';
      
      for (let i = 0; i < columns.length; i++) {
        const field = columns[i];
        
        if (field.startsWith('"') && !field.endsWith('"')) {
          // Start of a quoted field
          inQuote = true;
          currentField = field.substring(1);
        } else if (inQuote && field.endsWith('"')) {
          // End of a quoted field
          inQuote = false;
          currentField += ',' + field.substring(0, field.length - 1);
          processedColumns.push(currentField);
          currentField = '';
        } else if (inQuote) {
          // Middle of a quoted field
          currentField += ',' + field;
        } else {
          // Regular field
          processedColumns.push(field.replace(/^"|"$/g, ''));
        }
      }
      
      return processedColumns;
    });

  // Skip header row
  const dataRows = rows.slice(1);
  
  // Filter rows related to the domain
  const domainRows = dataRows.filter(row => {
    const recipient = row[0] || '';
    return recipient.includes(domain);
  });
  
  // Calculate statistics
  const totalMessages = domainRows.length;
  const received = domainRows.filter(row => row[0].includes(domain)).length;
  const sent = totalMessages - received;
  
  // Calculate response time by contact
  const contactResponseTimes = {};
  
  domainRows.forEach(row => {
    const recipient = row[0] || '';
    const responseTime = parseFloat(row[6] || '0');
    
    if (responseTime > 0) {
      // Extract email from recipient
      const emailMatch = recipient.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
      const email = emailMatch ? emailMatch[0] : 'unknown';
      
      if (!contactResponseTimes[email]) {
        contactResponseTimes[email] = {
          times: [],
          total: 0,
          count: 0
        };
      }
      
      contactResponseTimes[email].times.push(responseTime);
      contactResponseTimes[email].total += responseTime;
      contactResponseTimes[email].count++;
    }
  });
  
  // Calculate average response time for the domain
  let totalResponseTime = 0;
  let responseCount = 0;
  
  Object.values(contactResponseTimes).forEach(data => {
    totalResponseTime += data.total;
    responseCount += data.count;
  });
  
  const avgResponseTime = responseCount > 0 
    ? Math.round(totalResponseTime / responseCount) 
    : 0;
  
  // Calculate open rate
  const openCount = domainRows.reduce((sum, row) => sum + parseInt(row[3] || '0'), 0);
  const openRate = totalMessages > 0 
    ? Math.round((openCount / totalMessages) * 100) 
    : 0;
  
  // Prepare data for response time chart
  const responseTimeData = Object.entries(contactResponseTimes)
    .map(([email, data]) => ({
      name: email.split('@')[0], // Just use the username part
      responseTime: Math.round(data.total / data.count)
    }))
    .sort((a, b) => b.responseTime - a.responseTime)
    .slice(0, 5); // Top 5 contacts by response time
  
  return {
    pieData: {
      received,
      sent,
      total: totalMessages
    },
    avgResponseTime,
    openRate,
    responseTimeData,
    // Add more detailed statistics for better visualization
    totalOpens: openCount,
    totalContacts: Object.keys(contactResponseTimes).length,
    responseRate: responseCount > 0 ? Math.round((responseCount / totalMessages) * 100) : 0
  };
}
