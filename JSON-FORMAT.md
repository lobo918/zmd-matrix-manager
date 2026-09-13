# 导入导出 JSON 格式规范

本文档描述「终末地基质全收集管理器」导出/导入的 JSON 格式。

## 文件识别

导入时通过顶层 `type` 字段识别文件来源：

- `type: "zmd-matrix-manager"` → 本工具导出的数据，接受导入
- 其它值或字段缺失 → 拒绝导入，提示「不是本工具导出的文件」

## 版本

当前 `version: 2`。导入时不严格校验版本号，但建议保留。

## 完整版 vs 精简版

| 类型 | 是否含 `history` 键 | 用途 |
|---|---|---|
| 完整备份 | 有 | 换设备完整迁移 |
| 精简版 | 无 | 只同步基质数据和设置，文件更小 |

**导入行为差异**：

- 导入**完整版**：`history` 会被覆盖
- 导入**精简版**：当前 `history` 保留不变

区分方式：文件里有没有 `history` 键。

## 顶层结构

```json
{
  "type": "zmd-matrix-manager",
  "version": 2,
  "exportedAt": 1789266416742,
  "exportedAtReadable": "2026-09-13T02:26:56.742Z",
  "collected": { ... },
  "pendingDeletions": [ ... ],
  "enabledSites": { ... },
  "targets": [ ... ],
  "collapsedRegions": { ... },
  "sprintMode": false,
  "extraCopies": 0,
  "respectWeaponDemand": true,
  "recentHighlightDays": 7,
  "tieBreaker": "",
  "doubleDrop": false,
  "exactAlgo": false,
  "history": [ ... ]
}
```

## 字段说明

### 必填字段

#### `type`

- 类型：string
- 固定值：`"zmd-matrix-manager"`
- 缺失时导入失败

#### `collected`

- 类型：object
- 键格式：`基础|附加|技能`
- 值：实例数组（见下）

**键格式要求**：

- 三段用 `|` 分隔
- 基础属性必须在 `敏捷 / 力量 / 意志 / 智识 / 主能力` 中
- 附加属性必须是全称（如 `攻击提升`，而非 `攻击`）
- 技能属性必须在 14 个技能列表中（`强攻 / 压制 / 追袭 / 粉碎 / 昂扬 / 巧技 / 残暴 / 附术 / 医疗 / 切骨 / 迸发 / 夜幕 / 流转 / 效益`）

**实例字段**：

| 字段 | 类型 | 范围 | 说明 |
|---|---|---|---|
| `iid` | string | — | 唯一标识。缺失时导入自动补 |
| `baseLv` | number | 1~6 | 基础等级 |
| `addLv` | number | 1~6 | 附加等级 |
| `skillLv` | number | 1~3 | 技能等级 |
| `cost` | number | ≥ 0 | 剩余冷却脂总量。按等级计算，导入时不会自动重算，建议写正确值 |
| `time` | number | — | 毫秒时间戳。缺失时补当前时间 |
| `from` | string | — | 来源标记。缺失时补 `"导入"` |

**多副本**：数组长度可以 > 1，表示同一组合保留了多份。容量取决于武器需求数和设置：

- `respectWeaponDemand = true`（默认）：容量 = 武器需求数 + `extraCopies`
- `respectWeaponDemand = false`：容量 = 1

超出容量的部分不会被自动删除，但推荐算法会视为饱和，不再推荐刷取。

**示例**：

```json
"collected": {
  "敏捷|攻击提升|强攻": [
    {
      "iid": "imty9nqpyjs3hq",
      "baseLv": 1,
      "addLv": 3,
      "skillLv": 1,
      "cost": 2150,
      "time": 1789211558695,
      "from": "手动录入"
    }
  ],
  "智识|攻击提升|夜幕": [
    { "iid": "...", "baseLv": 6, "addLv": 6, "skillLv": 3, "cost": 0, "time": 0, "from": "手动录入" },
    { "iid": "...", "baseLv": 4, "addLv": 6, "skillLv": 3, "cost": 1100, "time": 0, "from": "手动录入" }
  ]
}
```

### 可选字段

所有可选字段缺失时使用默认值。类型不符时忽略并使用默认值。

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `exportedAt` | number | — | 导出时间戳，仅人类可读，导入时不使用 |
| `exportedAtReadable` | string | — | ISO 时间字符串，同上 |
| `pendingDeletions` | array | `[]` | 待删除暂存区 |
| `enabledSites` | object | `{}` | 刷取点开关 |
| `targets` | array | `[]` | 定向刷取目标 |
| `collapsedRegions` | object | `{}` | 地区折叠状态 |
| `sprintMode` | bool | `false` | 冲刺模式 |
| `extraCopies` | number | `0` | 额外保留份数（0~5） |
| `respectWeaponDemand` | bool | `true` | 是否按武器需求保留 |
| `recentHighlightDays` | number | `7` | 近期高亮天数（0~30，0 关闭） |
| `tieBreaker` | string | `""` | 平分优先地区名，空表示不指定 |
| `doubleDrop` | bool | `false` | 默认双倍刷取 |
| `exactAlgo` | bool | `false` | 精确算法（2 步前瞻） |
| `history` | array | 见下 | 刷取历史 |

### `pendingDeletions`

数组。每个元素结构与 `collected` 里的实例类似，额外带 `key` 字段。

```json
"pendingDeletions": [
  {
    "key": "意志|攻击提升|压制",
    "baseLv": 1,
    "addLv": 1,
    "skillLv": 1,
    "cost": 2240,
    "time": 1789227488706,
    "iid": "imtycqlxvsjgat"
  }
]
```

### `enabledSites`

对象。键是 `地区名::站点名` 格式，值是 bool。

- `false`：关闭
- `true` 或不存在：启用

```json
"enabledSites": {
  "四号谷地::枢纽区": true,
  "武陵::武陵城": false
}
```

**注意**：`{}` 表示全部启用，而不是全部关闭。

### `targets`

数组。定向刷取目标，最多 3 个。

```json
"targets": [
  { "base": "智识", "add": "攻击提升", "skill": "夜幕" }
]
```

`add` 必须是全称。

### `collapsedRegions`

对象。键是地区名，值是 bool（`true` 表示折叠）。

```json
"collapsedRegions": {
  "四号谷地": true,
  "武陵": true
}
```

### `history`

数组。刷取历史，**最新的记录在数组头部**（索引 0）。

```json
"history": [
  {
    "time": 1789228755856,
    "site": "手动录入",
    "items": [
      {
        "base": "力量",
        "baseLv": 1,
        "add": "物理伤害提升",
        "addLv": 1,
        "skill": "夜幕",
        "skillLv": 2
      }
    ],
    "results": [
      {
        "key": "力量|物理伤害提升|夜幕",
        "status": "new",
        "keep": true,
        "cost": 2120,
        "idx": 0,
        "iid": "imtyklrpszya2v"
      }
    ]
  }
]
```

**`site`**：刷取点名称，手动录入时固定为 `"手动录入"`。

**`items`**：本次提交的原始输入，长度等于本次录入卡片数量（3 或 6）。

**`results`**：每个 `item` 的处理结果，长度与 `items` 相同。

**`results.status`** 取值：

| 值 | `keep` | 含义 | 是否带 `iid` |
|---|---|---|---|
| `"new"` | `true` | 新增，进入了 `collected` | 是 |
| `"dup"` | `true` | 替换，旧份进入 `pendingDeletions` | 是 |
| `"dup"` | `false` | 丢弃，未进入任何数据 | 否 |

**`iid`**：对应 `collected` 里新实例的 `iid`。用于撤销时定位。

## 版本兼容性

- **旧版本**（`version: 1`，顶层带 `data` 字段）：**不再兼容**。需要手动转换为本文档描述的结构后再导入。
- **缺失可选字段**：使用默认值兜底。
- **缺失必填字段**（`type` / `collected`）：拒绝导入。
- **未知字段**：忽略，不报错。

## 手动构造最小示例

以下文件可以被成功导入，主界面进度会变为 1/840：

```json
{
  "type": "zmd-matrix-manager",
  "version": 2,
  "collected": {
    "敏捷|攻击提升|强攻": [
      {
        "iid": "test001",
        "baseLv": 1,
        "addLv": 1,
        "skillLv": 1,
        "cost": 2240,
        "time": 1789266416742,
        "from": "手动录入"
      }
    ]
  }
}
```

导入后：

- 其余 839 个组合未收集
- 所有设置使用默认值
- `enabledSites` 为空，所有刷取点启用
- `history` 保留导入前的值（因为没有 `history` 键）

## 来源标记 `from` 的取值

导出文件里 `collected` 实例的 `from` 字段可能包含以下值：

| 值 | 含义 |
|---|---|
| `"手动录入"` | 玩家通过录入区提交 |
| `"手动修改"` | 玩家在详细清单里改等级 |
| `"校验修复"` | 数据校验时补全 |
| `"撤销恢复"` | 撤销历史时恢复被替换的旧份 |
| `"导入"` | 从外部 JSON 导入 |

`from` 只用于信息展示和近期高亮判断，不影响任何核心逻辑。

## 校验工具

设置页「数据校验」提供自动扫描，会检查：

- 键格式是否为三段
- 附加属性是否使用了简称（可自动修复为全称）
- 基础/附加/技能是否在合法列表内
- 等级是否越界
- `cost` 是否与等级匹配
- `iid` 是否缺失或重复

「全部修复」会自动修正可修复项并打快照。导入外部构造的数据后如果发现异常，可以跑一次校验修复。