import * as echarts from 'echarts'
export const operation = ({ width, height, x, series }) => {
  const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width, height })
  chart.setOption({
    animation: false,
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: series.map((s) => ({ type: 'line', data: x.map((xv, j) => [xv, s[j]]) })),
  })
  const svg = chart.renderToSVGString()
  chart.dispose()
  return svg
}
