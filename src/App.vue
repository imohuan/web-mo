<template>
  <div class="w-full h-full flex items-center justify-center">
    <button @click="run">Run</button>
    <MonacoEditor class="w-full h-[600px]" />
  </div>
</template>

<script setup lang="ts">
import MonacoEditor from "./components/editor/monaco-editor.vue";
import OpenAI from "openai";

const run = async () => {
  const options = {
    apiKey: "sk-U3SKSHcCuyi6eDtR0h9QjZ05VVVi8hPIinlme8yRfafN6BS0", // error without this
    baseURL: `https://yunwu.ai/v1`,
    dangerouslyAllowBrowser: true,
  };
  const openai = new OpenAI(options);
  const stream = await openai.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [{ role: "user", content: "回复数字1" }],
    stream: true,
  });
  for await (const part of stream) {
    console.log(part.choices[0]?.delta?.content ?? "");
  }
};
</script>

<style scoped></style>
