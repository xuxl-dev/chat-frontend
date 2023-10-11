const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const binding = map.get(entry.target)
    if (entry.isIntersecting) {
      binding.value(true)
    } else {
      binding.value(false)
    }
  })
}, {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
})

const map = new WeakMap()

export default {
  mounted(el: any, binding: any) {
    observer.observe(el)
    map.set(el, binding)
  },
  unmounted(el: any, binding: any) {
    observer.unobserve(el)
    map.delete(el)
  },
}