<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent, TitleComponent])

const props = withDefaults(
  defineProps<{
    data: { name: string; value: number }[]
    height?: string
    /** 环形图 */
    ring?: boolean
    title?: string
  }>(),
  {
    height: '320px',
    ring: false,
    title: '',
  },
)

const option = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      name: props.title || '数据',
      type: 'pie',
      radius: props.ring ? ['40%', '70%'] : '65%',
      avoidLabelOverlap: false,
      label: { show: !props.ring, formatter: '{b}: {d}%' },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' },
      },
      labelLine: { show: !props.ring },
      data: props.data,
    },
  ],
}))

const style = computed<CSSProperties>(() => ({ height: props.height, width: '100%' }))
</script>

<template>
  <v-chart :option="option" :style="style" autoresize />
</template>
