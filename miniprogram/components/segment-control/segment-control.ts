Component({
  properties: {
    options: { type: Array, value: [] },
    value: { type: String, value: "" },
  },

  data: {
    activeIndex: 0,
    count: 0,
    sliderStyle: "",
  },

  observers: {
    "options,value": function () {
      this.syncStateFromProps();
    },
  },

  lifetimes: {
    attached() {
      this.syncStateFromProps();
    },
  },

  methods: {
    syncStateFromProps() {
      const options = (this.data.options || []) as string[];
      const value = String(this.data.value || "");
      const count = options.length;

      let activeIndex = 0;
      const foundIndex = options.findIndex((opt) => opt === value);
      if (foundIndex >= 0) activeIndex = foundIndex;

      const sliderStyle =
        count > 0
          ? `width:${100 / count}%;transform:translateX(${activeIndex * 100}%);`
          : "";

      this.setData({ count, activeIndex, sliderStyle });
    },

    onTapItem(event: any) {
      const index = Number(event.currentTarget?.dataset?.index);
      const value = String(event.currentTarget?.dataset?.value || "");
      if (!value) return;
      if (Number.isNaN(index)) return;

      const options = (this.data.options || []) as string[];
      if (index < 0 || index >= options.length) return;

      const sliderStyle = `width:${100 / options.length}%;transform:translateX(${index * 100}%);`;
      this.setData({ activeIndex: index, sliderStyle });
      this.triggerEvent("change", { value, index });
    },
  },
});
