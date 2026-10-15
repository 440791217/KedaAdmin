
export function createDefaultRegion(data = {}) {
  return {
    id: null,
    name: '',
    detectType: 'object',
    className: 'workpiece',
    confidence: 75,
    expectedCount: 1,
    enabled: true,
    color: '#409EFF',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    ...data
  }
}

export function createDemoRegions() {
  return [
    createDefaultRegion({
      id: 1,
      name: '产品主体区域',
      confidence: 80,
      color: '#409EFF',
      x: 28,
      y: 26,
      width: 44,
      height: 48
    }),

    createDefaultRegion({
      id: 2,
      name: '标签检测区域',
      className: 'label',
      confidence: 75,
      color: '#67C23A',
      x: 41,
      y: 42,
      width: 18,
      height: 13
    })
  ]
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function getRegionStyle(region) {
  return {
    left: region.x + '%',
    top: region.y + '%',
    width: region.width + '%',
    height: region.height + '%',
    borderColor: region.color || '#409EFF'
  }
}
