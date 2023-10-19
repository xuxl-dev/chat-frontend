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

/**
 * we use a WeakMap here to avoid memory leaks
 * if we would use a normal Map, the map would keep a reference to the element
 * and the element would never be garbage collected
 * the WeakMap only keeps a weak reference to the element
 * so the element can be garbage collected
 */
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