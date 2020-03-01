import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'

import Feedback from '@/components/Feedback.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('Feedback.vue', () => {
  it('should render correctly', () => {
    
    const wrapper = mount(Feedback,
      {
        localVue,
        propsData: { data: {} }
      })
    expect(wrapper.element).toMatchSnapshot()
  })
  it('does not render anything if data is empty', () => {
    const data = {}
    const wrapper = shallowMount(Feedback, {
      localVue,
      propsData: { data }
    })
    expect(wrapper.text()).toMatch("")
  })
})
