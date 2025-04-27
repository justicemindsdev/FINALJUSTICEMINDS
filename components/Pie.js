"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"


const chartConfig = {
  visitors: {
    label: "Visitors",
  }
}

export function Component({stats}) {
  
  const chartData = [
    { fordata: "received", emails: stats?.received, fill: "#72BAA9" },
    { fordata: "sent", emails: stats?.sent, fill: "#474E93" },
  ]

  return (
    
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-full w-auto bg-[#1d1d1d] rounded-lg "
        >
          <PieChart>
            <ChartTooltip className="bg-white text-black"
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="emails"
              nameKey="fordata"
              innerRadius={70}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-white text-3xl font-bold"
                        >
                          {stats?.total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Emails
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      
  )
}
