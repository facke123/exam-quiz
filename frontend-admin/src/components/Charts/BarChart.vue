<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const props = withDefaults(
  defineProps<{
    series: { name: string; data: number[] }[]
    xAxis: string[]
    height?: string
    horizontal?: boolean
  }>(),
  {
    height: '320px',
    horizontal: false,
  },
)

const option = computed(() => {
  const categoryAxis = { type: 'category', data: props.xAxis }
  const valueAxis = { type: 'value' }
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: props.series.map((s) => s.name), bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '3%', containLabel: true },
    xAxis: props.horizontal ? valueAxis : categoryAxis,
    yAxis: props.horizontal ? categoryAxis : valueAxis,
    series: props.series.map((s) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      barMaxWidth: 40,
    })),
  }
})

const style = computed<CSSProperties>(() => ({ height: props.height, width: '100%' }))
</script>

<template>
  <v-chart :option="option" :style="style" autoresize />
</template>
