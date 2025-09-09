import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';

interface LayoutState {
  sidebarCollapsed: Ref<boolean>;
  toggleSidebar: () => void;
  isMobile: Ref<boolean>;
}

export function useLayout(): LayoutState {
  const sidebarCollapsed = ref(false);
  const windowWidth = ref(window.innerWidth);

  // 移动端检测
  const isMobile = computed(() => windowWidth.value < 768);

  // 切换侧边栏状态
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  // 监听窗口大小变化
  const handleResize = () => {
    windowWidth.value = window.innerWidth;

    // 在移动端自动折叠侧边栏
    if (isMobile.value && !sidebarCollapsed.value) {
      sidebarCollapsed.value = true;
    }
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
    // 初始化时如果是移动端则折叠侧边栏
    if (isMobile.value) {
      sidebarCollapsed.value = true;
    }
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return {
    sidebarCollapsed,
    toggleSidebar,
    isMobile,
  };
}