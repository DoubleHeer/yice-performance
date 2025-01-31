import { useEffect, useState } from 'react';
import { Modal, Form, Input, message, Select, Button, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { httpPattern } from '../../../../utils';
import API from '../../../../utils/api';
import { IProject, IVersion } from 'typing';
import './style.less';

const Option = Select.Option;

interface IProps {
    open: boolean;
    isEdit: boolean;
    project: IProject | undefined;
    defaultVersionId: number | undefined;
    versionList: IVersion[];
    onCancel: (needFetch: any) => void;
}

export default function VersionModal(props: IProps) {
    const { open, isEdit, project, defaultVersionId, versionList, onCancel } = props;
    const { projectId, appName, devopsProjectIds } = project || {};
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [shiliFetching, setShiliFetching] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [devopsShiLiList, setDevopsShiLiList] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            form.resetFields();
            isEdit && getVersion();
            // getShiLis();
        }
    }, [open]);

    const getVersion = () => {
        setFormLoading(true);
        const versionId = form.getFieldValue('versionId') || defaultVersionId;
        API.getVersion({ versionId })
            .then((res) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { versionId: _versionId, ...version } = res.data || {};
                setTimeout(() => {
                    form.setFieldsValue(version);
                }, 200);
            })
            .finally(() => {
                setFormLoading(false);
            });
    };

    // 获取项目下的 devops 实例列表
    const getShiLis = () => {
        setShiliFetching(true);
        API.getShiLis({ devopsProjectIds })
            .then((res) => {
                setDevopsShiLiList(
                    res.data?.map((item: any) => {
                        return {
                            label: item.label,
                            value: item.id,
                        };
                    }) || []
                );
            })
            .finally(() => {
                setShiliFetching(false);
            });
    };

    // 选择了某个 devops 实例
    const handleSelect = (value: any) => {
        setFormLoading(true);
        const { label: name } = devopsShiLiList.find((item) => item.value === value) || {};
        API.getDevopsUrl({ shiliId: value })
            .then(({ data = {} }) => {
                const { portalfront: url, uicfront: loginUrl, username, password } = data;
                form.setFieldsValue({
                    name,
                    url: `${url}/${appName}/#/`,
                    loginUrl: `${loginUrl}/#/login`,
                    username,
                    password,
                });
            })
            .finally(() => {
                setFormLoading(false);
            });
    };

    const handleOk = () => {
        form.validateFields().then((values) => {
            setSaving(true);
            // 去除值为空字符串的字段
            const params = Object.keys(values)
                .filter((key) => values[key] !== '')
                .reduce((acc, key) => ({ ...acc, [key]: values[key] }), {});
            console.log(params);
            API[isEdit ? 'updateVersion' : 'createVersion']({
                ...params,
                projectId,
            })
                .then(() => {
                    message.success('保存成功！');
                    onCancel(true);
                })
                .finally(() => {
                    setSaving(false);
                });
        });
    };

    // 删除版本
    const handleDelete = () => {
        const versionId = form.getFieldValue('versionId') || defaultVersionId;
        Modal.confirm({
            title: '是否删除该版本？',
            icon: <ExclamationCircleOutlined />,
            onOk() {
                API.deleteVersion({ versionId }).then(() => {
                    onCancel(true);
                    message.success('操作成功！');
                });
            },
        });
    };

    // 输入框的回车事件
    const handleInputEnter = (e: any) => {
        // 中文输入法输入时回车，keyCode 是 229；光标在输入框直接回车，keyCode 是 13
        !saving && e.keyCode === 13 && handleOk();
    };

    const footerRender = () => {
        return (
            <div className="footer-btn">
                <div className="btn-box">
                    {isEdit ? (
                        <Button danger onClick={handleDelete}>
                            删除
                        </Button>
                    ) : null}
                </div>
                <Button onClick={onCancel}>取消</Button>
                <Button type="primary" loading={saving} onClick={handleOk}>
                    确定
                </Button>
            </div>
        );
    };

    return (
        <Modal
            title="子产品版本信息"
            open={open}
            forceRender
            destroyOnClose
            onCancel={onCancel}
            footer={footerRender()}
        >
            <Spin spinning={formLoading}>
                <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} name="Form">
                    {isEdit ? (
                        <Form.Item
                            name="versionId"
                            label="版本"
                            rules={[{ required: true }]}
                            initialValue={defaultVersionId ? `${defaultVersionId}` : undefined}
                        >
                            <Select
                                loading={formLoading}
                                placeholder="请选择版本"
                                onChange={getVersion}
                            >
                                {versionList.map((version: IVersion) => {
                                    return (
                                        <Option
                                            key={version.versionId}
                                            value={`${version.versionId}`}
                                        >
                                            {version.name}
                                        </Option>
                                    );
                                })}
                            </Select>
                        </Form.Item>
                    ) : null}
                    {/* <Form.Item name="devopsShiLiId" label="绑定实例">
                        <Select
                            allowClear
                            placeholder="请选择绑定的 devops 实例"
                            disabled={isEdit}
                            options={devopsShiLiList}
                            loading={shiliFetching}
                            onSelect={handleSelect}
                        />
                    </Form.Item> */}
                    <Form.Item name="name" label="版本名称" rules={[{ required: true }]}>
                        <Input
                            allowClear
                            placeholder="请输入版本名称"
                            onPressEnter={handleInputEnter}
                        />
                    </Form.Item>
                    <Form.Item
                        name="url"
                        label="检测地址"
                        rules={[
                            { required: true },
                            { pattern: httpPattern, message: '请输入以 http(s) 开头的检测地址' },
                        ]}
                    >
                        <Input allowClear placeholder="请输入检测地址" />
                    </Form.Item>
                    <Form.Item name="loginUrl" label="登录地址">
                        <Input allowClear placeholder="请输入登录地址" />
                    </Form.Item>
                    <Form.Item name="username" label="用户名">
                        <Input allowClear placeholder="请输入用户名" />
                    </Form.Item>
                    <Form.Item name="password" label="用户密码">
                        <Input allowClear placeholder="请输入用户密码" />
                    </Form.Item>
                    <Form.Item name="tenantId" label="租户ID">
                        <Input allowClear placeholder="请输入租户ID" />
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
}
