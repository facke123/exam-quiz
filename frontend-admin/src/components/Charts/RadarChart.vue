<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'

use([CanvasRenderer, RadarChart, TooltipComponent, LegendComponent, TitleComponent])

const props = withDefaults(
  defineProps<{
    indicators: { name: string; max: number }[]
    series: { name: string; value: number[] }[]
    height?: string
  }>(),
  {
    height: '320px',
  },
)

const option = computed(() => ({
  tooltip: {},
  legend: { data: props.series.map((s) => s.name), bottom: 0 },
  radar: {
    indicator: props.indicators,
    radius: '65%',
  },
  series: [
    {
      type: 'radar',
      data: props.series.map((s) => ({
        value: s.value,
        name: s.name,
        areaStyle: { opacity: 0.2 },
      })),
    },
  ],
}))

const style = computed<CSSProperties>(() => ({ height: props.height, width: '100%' }))
</script>

<template>
  <v-chart :option="option" :style="style" autoresize />
</template>
