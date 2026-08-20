<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const props = withDefaults(
  defineProps<{
    series: { name: string; data: number[] }[]
    xAxis: string[]
    height?: string
    smooth?: boolean
    area?: boolean
  }>(),
  {
    height: '320px',
    smooth: true,
    area: true,
  },
)

const option = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    data: props.series.map((s) => s.name),
    bottom: 0,
  },
  grid: { left: '3%', right: '4%', bottom: '10%', top: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.xAxis,
  },
  yAxis: { type: 'value' },
  series: props.series.map((s) => ({
    name: s.name,
    type: 'line',
    smooth: props.smooth,
    data: s.data,
    areaStyle: props.area ? {} : undefined,
  })),
}))

const style = computed<CSSProperties>(() => ({ height: props.height, width: '100%' }))
</script>

<template>
  <v-chart :option="option" :style="style" autoresize />
</template>
