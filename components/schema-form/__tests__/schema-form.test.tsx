/**
 * 表单引擎测试：覆盖旧版 form-render 在本项目里用到的全部能力
 * （嵌套对象、select/radio/slider/textarea、必填与正则校验、自定义控件、setValueByPath）。
 */
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SchemaForm, useSchemaForm } from "@/components/schema-form"
import type { FormError, SchemaFormInstance, SchemaNode } from "@/components/schema-form/types"

type HarnessProps = {
  schema: SchemaNode
  onFinish?: (values: Record<string, unknown>, errors: FormError[]) => void
  onValuesChange?: (changed: Record<string, unknown>) => void
  onReady?: (form: SchemaFormInstance) => void
  widgets?: Record<string, React.ComponentType<never>>
}

function Harness({ schema, onFinish, onValuesChange, onReady, widgets }: HarnessProps) {
  const form = useSchemaForm()
  React.useEffect(() => {
    onReady?.(form)
  }, [form, onReady])
  return (
    <>
      <SchemaForm
        form={form}
        schema={schema}
        onFinish={onFinish}
        onValuesChange={onValuesChange}
        widgets={widgets as never}
      />
      <button type="button" onClick={form.submit}>
        提交
      </button>
    </>
  )
}

const flatSchema: SchemaNode = {
  type: "object",
  properties: {
    项目名称: { type: "string", title: "项目名称", required: true, order: 1 },
    项目简介: { type: "string", title: "项目简介", format: "textarea", maxLength: 20, order: 2 },
    项目类别: {
      type: "string",
      title: "项目类别",
      widget: "select",
      enum: ["A", "B"],
      enumNames: ["甲类", "乙类"],
      required: true,
      order: 3,
    },
    是否STITP: {
      type: "string",
      title: "是否STITP",
      widget: "radio",
      enum: ["是", "否"],
      enumNames: ["是", "否"],
      order: 4,
    },
  },
}

describe("SchemaForm", () => {
  it("按 order 渲染字段，必填项显示星号", () => {
    render(<Harness schema={flatSchema} />)
    const labels = screen.getAllByText(/项目名称|项目简介|项目类别|是否STITP/)
    expect(labels[0]).toHaveTextContent("项目名称")
    expect(screen.getByLabelText(/项目名称/)).toBeInTheDocument()
  })

  it("必填校验失败时不产生提交数据，并给出错误提示", async () => {
    const onFinish = jest.fn()
    render(<Harness schema={flatSchema} onFinish={onFinish} />)
    await userEvent.click(screen.getByRole("button", { name: "提交" }))

    await waitFor(() => expect(onFinish).toHaveBeenCalled())
    const errors = onFinish.mock.calls[0][1] as FormError[]
    expect(errors.map((item) => item.name).sort()).toEqual(["项目名称", "项目类别"])
    expect(screen.getAllByText("项目名称不能为空").length).toBeGreaterThan(0)
  })

  it("输入后可以通过校验，提交扁平结构的数据", async () => {
    const onFinish = jest.fn()
    let form!: SchemaFormInstance
    render(
      <Harness
        schema={flatSchema}
        onFinish={onFinish}
        onReady={(instance) => {
          form = instance
        }}
      />
    )

    await userEvent.type(screen.getByLabelText(/项目名称/), "智能小车")
    form.setValueByPath("项目类别", "A")

    await userEvent.click(screen.getByRole("button", { name: "提交" }))
    await waitFor(() => expect(onFinish).toHaveBeenCalled())

    const [values, errors] = onFinish.mock.calls.at(-1) as [Record<string, unknown>, FormError[]]
    expect(errors).toHaveLength(0)
    expect(values).toMatchObject({ 项目名称: "智能小车", 项目类别: "A" })
  })

  it("正则规则不通过时报出 schema 中的提示语", async () => {
    const onFinish = jest.fn()
    render(
      <Harness
        schema={{
          type: "object",
          properties: {
            code: {
              type: "string",
              title: "学号",
              required: true,
              rules: [{ pattern: /^B\d{8}$/, message: "请输入正确的学号" }],
            },
          },
        }}
        onFinish={onFinish}
      />
    )
    await userEvent.type(screen.getByLabelText(/学号/), "abc")
    await userEvent.click(screen.getByRole("button", { name: "提交" }))
    await waitFor(() => expect(screen.getByText("请输入正确的学号")).toBeInTheDocument())
    expect((onFinish.mock.calls.at(-1) as [unknown, FormError[]])[1]).toHaveLength(1)
  })

  it("支持嵌套对象：setValueByPath 写入与提交都是嵌套结构", async () => {
    const onFinish = jest.fn()
    let form!: SchemaFormInstance
    render(
      <Harness
        schema={{
          type: "object",
          properties: {
            listOfParti: {
              type: "object",
              title: "参赛队员",
              properties: {
                leader: {
                  type: "object",
                  title: "队长信息",
                  properties: {
                    name: { type: "string", title: "姓名", readOnly: true },
                    code: { type: "string", title: "学号", readOnly: true },
                  },
                },
              },
            },
          },
        }}
        onFinish={onFinish}
        onReady={(instance) => {
          form = instance
        }}
      />
    )

    form.setValueByPath("listOfParti.leader", { name: "王小明", code: "B21021021" })
    await waitFor(() => expect(screen.getByLabelText(/姓名/)).toHaveValue("王小明"))

    await userEvent.click(screen.getByRole("button", { name: "提交" }))
    await waitFor(() => expect(onFinish).toHaveBeenCalled())
    expect(onFinish.mock.calls.at(-1)?.[0]).toEqual({
      listOfParti: { leader: { name: "王小明", code: "B21021021" } },
    })
  })

  it("onValuesChange 以完整路径回传变更，用于动态表单", async () => {
    const onValuesChange = jest.fn()
    render(
      <Harness
        schema={{
          type: "object",
          properties: {
            listOfParti: {
              type: "object",
              properties: {
                select_numOfParti: {
                  type: "number",
                  title: "队员人数",
                  widget: "slider",
                  min: 1,
                  max: 5,
                  default: 1,
                },
              },
            },
          },
        }}
        onValuesChange={onValuesChange}
      />
    )

    const slider = screen.getByRole("slider")
    slider.focus()
    await userEvent.keyboard("{ArrowRight}")

    await waitFor(() => expect(onValuesChange).toHaveBeenCalled())
    expect(onValuesChange.mock.calls.at(-1)?.[0]).toEqual({
      "listOfParti.select_numOfParti": 2,
    })
  })

  it("schema 中的 default 会写入表单值", async () => {
    let form!: SchemaFormInstance
    render(
      <Harness
        schema={{
          type: "object",
          properties: {
            count: { type: "number", title: "人数", widget: "slider", min: 0, max: 5, default: 3 },
          },
        }}
        onReady={(instance) => {
          form = instance
        }}
      />
    )
    await waitFor(() => expect(form.getValueByPath("count")).toBe(3))
  })

  it("自定义控件（customUpload）接收 schema.props 并可写回值", async () => {
    const onFinish = jest.fn()
    const Upload = ({
      value,
      onChange,
      inputName,
    }: {
      value: unknown
      onChange: (v: unknown) => void
      inputName?: string
    }) => (
      <button type="button" onClick={() => onChange(`https://cdn/${inputName}.pdf`)}>
        上传 {inputName} {String(value ?? "")}
      </button>
    )

    render(
      <Harness
        schema={{
          type: "object",
          properties: {
            申报书: {
              type: "string",
              title: "申报书",
              widget: "customUpload",
              required: true,
              props: { inputName: "申报书", accept: ".pdf" },
            },
          },
        }}
        widgets={{ customUpload: Upload as never }}
        onFinish={onFinish}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: /上传 申报书/ }))
    await userEvent.click(screen.getByRole("button", { name: "提交" }))
    await waitFor(() => expect(onFinish).toHaveBeenCalled())
    expect(onFinish.mock.calls.at(-1)?.[0]).toEqual({ 申报书: "https://cdn/申报书.pdf" })
    expect((onFinish.mock.calls.at(-1) as [unknown, FormError[]])[1]).toHaveLength(0)
  })
})
