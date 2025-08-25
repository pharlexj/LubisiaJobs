import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
} from "antd";
import { Department, Award, StudyArea, JobGroup, Job } from "@/types/jobTypes";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const { Option } = Select;

// Validation schema using zod
const jobSchema = z.object({
  code: z.string().min(1, "Advert number is required"),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date({ required_error: "End date is required" }),
  award_id: z.string().min(1, "Certificate is required"),
  required_courses: z.string().min(1, "Course selection is required"),
  title: z.string().min(1, "Job title is required"),
  grade: z.string().min(1, "Job group is required"),
  posts: z.coerce.number().min(1, "Number of posts is required"),
  department_id: z.string().min(1, "Department is required"),
  category: z.string().min(1, "Status is required"),
  experience: z.coerce.number().min(0, "Experience is required"),
  description: z.string().min(1, "Description is required"),
  advert_type: z.string().min(1, "Advert type is required"),
  required_certificate: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobModalProps {
  isOpen: boolean;
  isEdit: boolean;
  closeModal: () => void;
  onSubmit: (values: JobFormValues) => void;
  initialValues?: Partial<Job>;
  departments: Department[];
  awards: Award[];
  studyArea: StudyArea[];
  jg: JobGroup[];
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  isEdit,
  closeModal,
  onSubmit,
  initialValues,
  departments,
  awards,
  studyArea,
  jg,
}) => {
  const [form] = Form.useForm();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (isEdit && initialValues) {
      reset(initialValues as any);
      form.setFieldsValue(initialValues);
    } else {
      reset({} as any);
      form.resetFields();
    }
  }, [isEdit, initialValues, form, reset]);

  const handleOk = handleSubmit((values) => {
    onSubmit(values);
    closeModal();
  });

  return (
    <Modal
      className="job-modal-header-green"
      title={isEdit ? "Edit and Update Adverts" : "Job Advertisements"}
      open={isOpen}
      onCancel={() => {
        form.resetFields();
        closeModal();
      }}
      okText={isEdit ? "Update" : "Save"}
      width="90%"
      style={{ maxWidth: "75%" }}
      onOk={handleOk}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={4}>
            <Form.Item
              name="code"
              label="Advert #"
              rules={[{ required: true, message: "Advert number is required" }]}
            >
              <Input placeholder="Enter Advert Number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item
              name="start_date"
              label="Start Date"
              rules={[{ required: true, message: "Start date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item
              name="end_date"
              label="End Date"
              rules={[{ required: true, message: "End date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item
              name="award_id"
              label="Certificate"
              rules={[{ required: true, message: "Certificate is required" }]}
            >
              <Select>
                {awards.map((a) => (
                  <Option key={a.award_id} value={a.award_id}>
                    {a.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="required_courses"
              label="Courses"
              rules={[{ required: true, message: "Course selection is required" }]}
            >
              <Select placeholder="Select required courses">
                {studyArea.map((course) => (
                  <Option key={course.area_id} value={course.area_id}>
                    {course.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item
              name="title"
              label="Job Title"
              rules={[{ required: true, message: "Job title is required" }]}
            >
              <Input placeholder="Enter job title" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item
              name="grade"
              label="JG/ Scale"
              rules={[{ required: true, message: "Job group is required" }]}
            >
              <Select>
                {jg.map((j) => (
                  <Option key={j.jg_id} value={j.jg_id}>
                    {j.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item
              name="posts"
              label="Posts"
              rules={[{ required: true, message: "Number of posts is required" }]}
            >
              <Input type="number" placeholder="Enter number of posts" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item
              name="department_id"
              label="Department"
              rules={[{ required: true, message: "Department is required" }]}
            >
              <Select placeholder="Select department">
                {departments.map((dept) => (
                  <Option key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item
              name="category"
              label="Status"
              rules={[{ required: true, message: "Status is required" }]}
            >
              <Select placeholder="Select status">
                <Option value="open">Open</Option>
                <Option value="internal">Internal</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item
              name="experience"
              label="Experience"
              rules={[{ required: true, message: "Experience is required" }]}
            >
              <Input placeholder="Number of Experience" type="number" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Description is required" }]}
        >
          <Input.TextArea
            placeholder="Enter job description"
            style={{ minHeight: 200 }}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="advert_type"
              label="Advert Type"
              rules={[{ required: true, message: "Advert type is required" }]}
            >
              <Select placeholder="Advert Type">
                <Option value="1">First-time Advert</Option>
                <Option value="2">Re-Advertisement</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="required_certificate" label="Required Document (optional)">
              <Select placeholder="Required Document">
                <Option value="1">Letter of First Appointment</Option>
                <Option value="2">Letter of Last Promotion</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
