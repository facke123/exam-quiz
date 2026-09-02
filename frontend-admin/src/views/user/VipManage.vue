<template>
  <div class="vip-manage-page">
    <!-- 顶部标题与说明 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">💎 VIP 会员与套餐价格配置</h2>
        <p class="subtitle">实时管理全站 VIP 会员套餐价格、会员名称、有效期限与权益说明，并查询与管理 VIP 学员名单</p>
      </div>
      <div class="header-actions">
        <el-button v-if="activeTab === 'plans'" type="primary" class="primary-btn" @click="handleAddPlan">
          <el-icon><Plus /></el-icon> 新建会员套餐
        </el-button>
        <el-button v-if="activeTab === 'users'" type="primary" class="primary-btn" @click="handleOpenGrantModal">
          <el-icon><Plus /></el-icon> 手动赠送 / 开通 VIP
        </el-button>
        <el-button v-if="activeTab === 'payment' || activeTab === 'cards'" type="success" class="primary-btn" @click="handleOpenCardModal">
          <el-icon><Tickets /></el-icon> 批量生成 VIP 卡密
        </el-button>
      </div>
    </div>

    <!-- 顶部数据概览统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon bg-gold">💎</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.totalVipCount }}</div>
          <div class="stat-label">VIP 会员总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-purple">👑</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.lifetimeCount }}</div>
          <div class="stat-label">永久尊享会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-blue">📅</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.yearlyCount }}</div>
          <div class="stat-label">年卡会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-emerald">⏱️</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.quarterlyCount + stats.monthlyCount }}</div>
          <div class="stat-label">季卡 / 月卡会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-indigo">🏷️</div>
        <div class="stat-info">
          <div class="stat-num">{{ planList.length }}</div>
          <div class="stat-label">在售会员套餐</div>
        </div>
      </div>
    </div>

    <!-- 主体 Tabs 面板 -->
    <div class="main-tabs-card">
      <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
        <!-- Tab 1: VIP 套餐与价格配置 -->
        <el-tab-pane name="plans">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><Setting /></el-icon>
              <span>VIP 会员套餐与价格配置 ({{ planList.length }})</span>
            </span>
          </template>

          <!-- 顶部工具栏 -->
          <div class="filter-toolbar">
            <div class="toolbar-left">
              <span class="tool-tip">💡 前台 H5「会员中心」页面将实时根据下表展示对应套餐名称、价格与权益。</span>
            </div>
            <div class="toolbar-right">
              <el-button type="warning" plain icon="RefreshRight" @click="handleResetDefaultPlans">
                重置为官方默认价格 (月卡6/季卡15/年卡60/永久68)
              </el-button>
              <el-button icon="Refresh" @click="fetchPlans">刷新</el-button>
            </div>
          </div>

          <!-- 套餐数据表格 -->
          <el-table v-loading="plansLoading" :data="planList" class="custom-table" stripe border>
            <el-table-column prop="id" label="ID" width="70" align="center" />

            <el-table-column label="套餐名称" min-width="160">
              <template #default="{ row }">
                <div class="plan-name-cell">
                  <span class="p-emoji">{{ getPlanEmoji(row.type) }}</span>
                  <div class="p-title-box">
                    <span class="p-name">{{ row.name }}</span>
                    <span v-if="row.type === 'lifetime' || row.duration >= 30000" class="badge-lifetime">永久终身</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="类型标识" width="130" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getPlanTagType(row.type)">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="售卖现价 (¥)" width="140" align="center">
              <template #default="{ row }">
                <span class="price-highlight">¥{{ row.price }}</span>
              </template>
            </el-table-column>

            <el-table-column label="划线原价 (¥)" width="130" align="center">
              <template #default="{ row }">
                <span class="orig-price-text">¥{{ row.originalPrice || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="有效时长" width="130" align="center">
              <template #default="{ row }">
                <span v-if="row.type === 'lifetime' || row.duration >= 30000" class="duration-lifetime">
                  永久有效
                </span>
                <span v-else class="duration-days">
                  {{ row.duration }} 天
                </span>
              </template>
            </el-table-column>

            <el-table-column label="核心功能特性 / 权益清单" min-width="260">
              <template #default="{ row }">
                <div class="features-wrap">
                  <el-tag
                    v-for="(f, i) in (Array.isArray(row.features) ? row.features : [])"
                    :key="i"
                    size="small"
                    effect="plain"
                    class="f-tag"
                  >
                    {{ f }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="上架状态" width="120" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status === 1"
                  active-text="上架"
                  inactive-text="下架"
                  inline-prompt
                  @change="(val) => handleTogglePlanStatus(row, val)"
                />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="160" fixed="right" align="center">
              <template #default="{ row }">
                <div class="ops-cell">
                  <el-button link type="primary" size="small" @click="handleEditPlan(row)">
                    编辑设置
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleDeletePlan(row)">
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 2: VIP 会员用户查询与权限管理 -->
        <el-tab-pane name="users">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><User /></el-icon>
              <span>VIP 会员用户查询 ({{ vipUsersTotal }})</span>
            </span>
          </template>

          <!-- 筛选工具栏 -->
          <div class="filter-toolbar">
            <div class="filter-inputs">
              <el-input
                v-model="userQuery.keyword"
                placeholder="🔍 搜索学员账号 / 手机号 / 邮箱..."
                prefix-icon="Search"
                clearable
                style="width: 280px"
                @keyup.enter="fetchVipUsers"
              />
              <el-select
                v-model="userQuery.vipLevel"
                placeholder="全部会员类型"
                clearable
                style="width: 170px"
                @change="fetchVipUsers"
              >
                <el-option label="全部 VIP 会员" value="" />
                <el-option label="👑 永久尊享会员" value="lifetime" />
                <el-option label="📅 年卡会员" value="yearly" />
                <el-option label="⏱️ 季卡会员" value="quarterly" />
                <el-option label="⏱️ 月卡会员" value="monthly" />
              </el-select>
              <el-button type="primary" icon="Search" @click="fetchVipUsers">查询</el-button>
              <el-button @click="resetUserQuery">重置</el-button>
            </div>
            <div class="filter-ops">
              <el-button icon="Refresh" @click="fetchVipUsers">刷新</el-button>
            </div>
          </div>

          <!-- VIP 用户数据表格 -->
          <el-table v-loading="usersLoading" :data="vipUserList" class="custom-table" stripe border>
            <el-table-column prop="id" label="ID" width="70" align="center" />

            <el-table-column label="学员账号 / 昵称" min-width="200">
              <template #default="{ row }">
                <div class="user-cell">
                  <el-avatar :size="36" :src="row.avatar" class="u-avatar">
                    {{ (row.nickname || row.username).charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div class="u-text">
                    <div class="u-name">{{ row.username }}</div>
                    <div class="u-nick">{{ row.nickname || '未设置昵称' }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="手机号 / 邮箱" min-width="170">
              <template #default="{ row }">
                <div class="contact-cell">
                  <div v-if="row.phone" class="phone">📱 {{ row.phone }}</div>
                  <div v-if="row.email" class="email">✉️ {{ row.email }}</div>
                  <div v-if="!row.phone && !row.email" class="none">—</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="会员等级" width="160" align="center">
              <template #default="{ row }">
                <span v-if="row.isLifetime || row.vipLevel >= 4" class="vip-badge-lifetime">
                  👑 永久尊享会员
                </span>
                <span v-else-if="row.vipLevel === 3" class="vip-badge-yearly">
                  📅 年卡会员
                </span>
                <span v-else-if="row.vipLevel === 2" class="vip-badge-quarterly">
                  ⏱️ 季卡会员
                </span>
                <span v-else class="vip-badge-monthly">
                  ⏱️ 月卡会员
                </span>
              </template>
            </el-table-column>

            <el-table-column label="VIP 有效期 / 状态" min-width="200" align="center">
              <template #default="{ row }">
                <div class="expire-cell">
                  <div v-if="row.isLifetime || row.vipLevel >= 4" class="exp-lifetime">
                    ✨ 永久有效 (终身免续费)
                  </div>
                  <div v-else class="exp-date">
                    <span>{{ formatTime(row.vipExpireAt) }}</span>
                    <span v-if="row.daysRemaining !== undefined" class="days-pill">
                      余 {{ row.daysRemaining }} 天
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="账号状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'active' ? '正常' : '已禁用' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <div class="ops-cell">
                  <el-button link type="primary" size="small" @click="handleEditUserVip(row)">
                    调整会员 / 续期
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleRevokeVip(row)">
                    取消资格
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="userQuery.page"
              v-model:page-size="userQuery.pageSize"
              :total="vipUsersTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchVipUsers"
              @current-change="fetchVipUsers"
            />
          </div>
        </el-tab-pane>

        <!-- Tab 3: 📜 充值订单流水与订单管理 -->
        <el-tab-pane name="orders">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><Document /></el-icon>
              <span>充值订单流水 ({{ ordersTotal }})</span>
            </span>
          </template>

          <!-- 订单筛选工具栏 -->
          <div class="filter-toolbar">
            <div class="filter-inputs">
              <el-input
                v-model="orderQuery.keyword"
                placeholder="🔍 搜索订单号 / 交易号 / 手机号 / 用户名..."
                prefix-icon="Search"
                clearable
                style="width: 300px"
                @keyup.enter="fetchOrders"
              />
              <el-select
                v-model="orderQuery.payStatus"
                placeholder="全部支付状态"
                clearable
                style="width: 150px"
                @change="fetchOrders"
              >
                <el-option label="全部状态" value="" />
                <el-option label="🟢 已支付成功" value="paid" />
                <el-option label="🟠 待付款/处理中" value="pending" />
                <el-option label="⚪ 已退款" value="refunded" />
              </el-select>
              <el-select
                v-model="orderQuery.payMethod"
                placeholder="支付通道"
                clearable
                style="width: 140px"
                @change="fetchOrders"
              >
                <el-option label="全部支付通道" value="" />
                <el-option label="微信支付" value="wechat" />
                <el-option label="支付宝" value="alipay" />
                <el-option label="沙箱/模拟" value="mock" />
                <el-option label="卡密兑换" value="card_redeem" />
              </el-select>
              <el-button type="primary" icon="Search" @click="fetchOrders">查询订单</el-button>
              <el-button @click="resetOrderQuery">重置</el-button>
            </div>
            <div class="filter-ops">
              <el-button icon="Refresh" @click="fetchOrders">刷新</el-button>
            </div>
          </div>

          <!-- 订单数据表格 -->
          <el-table v-loading="ordersLoading" :data="orderList" class="custom-table" stripe border>
            <el-table-column prop="id" label="ID" width="70" align="center" />

            <el-table-column label="订单编号" min-width="190">
              <template #default="{ row }">
                <div class="order-no-cell">
                  <span class="o-num">{{ row.orderNo }}</span>
                  <el-button link type="primary" size="small" @click="copyText(row.orderNo)">复制</el-button>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="下单学员" min-width="170">
              <template #default="{ row }">
                <div class="order-user-info">
                  <span class="ou-name">{{ row.nickname || row.username }}</span>
                  <span v-if="row.phone" class="ou-phone">📱 {{ row.phone }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="购买套餐" width="160" align="center">
              <template #default="{ row }">
                <el-tag effect="light" type="warning" size="small">
                  {{ row.planName }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="实付金额 (¥)" width="130" align="center">
              <template #default="{ row }">
                <span class="order-amount-text">¥{{ Number(row.amount).toFixed(2) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="支付渠道" width="130" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.payMethod === 'wechat'" type="success" size="small">🟢 微信支付</el-tag>
                <el-tag v-else-if="row.payMethod === 'alipay'" type="primary" size="small">🔵 支付宝</el-tag>
                <el-tag v-else-if="row.payMethod === 'card_redeem'" type="info" size="small">🔑 卡密兑换</el-tag>
                <el-tag v-else type="warning" size="small">⚡ 沙箱快捷</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="支付状态" width="130" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.payStatus === 'paid'" type="success" effect="dark" size="small">
                  已支付
                </el-tag>
                <el-tag v-else-if="row.payStatus === 'pending'" type="warning" effect="plain" size="small">
                  待确认/待支付
                </el-tag>
                <el-tag v-else-if="row.payStatus === 'refunded'" type="info" size="small">
                  已退款
                </el-tag>
                <el-tag v-else type="danger" size="small">
                  {{ row.payStatus }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="转账核对信息 / 交易号" min-width="190">
              <template #default="{ row }">
                <div v-if="row.tradeNo && row.tradeNo !== '-'" class="trade-no-info">
                  <el-tag v-if="row.tradeNo.startsWith('REMARK:')" type="warning" size="small" effect="light">
                    {{ row.tradeNo }}
                  </el-tag>
                  <span v-else class="o-num">{{ row.tradeNo }}</span>
                </div>
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>

            <el-table-column label="下单时间 / 支付时间" min-width="190">
              <template #default="{ row }">
                <div class="time-col">
                  <div class="t-row"><span class="t-lbl">创建:</span> {{ row.createdAt }}</div>
                  <div v-if="row.paidAt" class="t-row"><span class="t-lbl">支付:</span> {{ row.paidAt }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="160" fixed="right" align="center">
              <template #default="{ row }">
                <div class="ops-cell">
                  <el-button
                    v-if="row.payStatus === 'pending'"
                    link
                    type="success"
                    size="small"
                    @click="handleManualActivateOrder(row)"
                  >
                    ⚡ 手动核销激活
                  </el-button>
                  <el-button
                    v-if="row.payStatus === 'paid'"
                    link
                    type="danger"
                    size="small"
                    @click="handleRefundOrder(row)"
                  >
                    退款
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 订单分页 -->
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="orderQuery.page"
              v-model:page-size="orderQuery.pageSize"
              :total="ordersTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchOrders"
              @current-change="fetchOrders"
            />
          </div>
        </el-tab-pane>

        <!-- Tab 4: ⚙️ 支付渠道与收款设置 -->
        <el-tab-pane name="payment">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><Money /></el-icon>
              <span>支付通道与收款配置</span>
            </span>
          </template>

          <div v-loading="paymentLoading" class="payment-config-container">
            <!-- 模块 1: 沙箱 / 演示一键快捷支付 -->
            <div class="config-card">
              <div class="cc-header">
                <div class="cc-title">
                  <span class="cc-icon">⚡</span>
                  <span>沙箱/演示一键快捷支付通道</span>
                </div>
                <el-switch v-model="paymentForm.sandboxEnabled" active-text="启用" inactive-text="关闭" />
              </div>
              <div class="cc-body">
                <p class="cc-desc">
                  开启后，前台用户在收银台点击「⚡ 沙箱一键快捷支付」无需扫码直接完成支付并自动激活 VIP。非常适合系统演示、免个人资质快速运营！
                </p>
              </div>
            </div>

            <!-- 模块 2: 微信支付收款设置 -->
            <div class="config-card">
              <div class="cc-header">
                <div class="cc-title">
                  <span class="cc-icon">🟢</span>
                  <span>微信支付通道设置</span>
                </div>
                <el-switch v-model="paymentForm.wechatEnabled" active-text="启用" inactive-text="关闭" />
              </div>
              <div class="cc-body">
                <el-form label-width="140px" class="inner-form">
                  <el-form-item label="支付模式">
                    <el-radio-group v-model="paymentForm.wechatType">
                      <el-radio value="qr_code">个人/商户微信收款二维码 (学员扫码转账人工或自动核销)</el-radio>
                      <el-radio value="merchant">微信官方商户 Native / JSAPI 直连</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <el-form-item v-if="paymentForm.wechatType === 'qr_code'" label="微信收款二维码URL">
                    <el-input v-model="paymentForm.wechatQr" placeholder="请输入微信收款二维码图片地址（支持 https:// 或 /uploads/ 路径）" />
                    <div v-if="paymentForm.wechatQr" class="qr-preview-box">
                      <img :src="paymentForm.wechatQr" alt="微信收款码预览" class="qr-preview-img" />
                    </div>
                  </el-form-item>

                  <template v-if="paymentForm.wechatType === 'merchant'">
                    <el-form-item label="微信 AppID">
                      <el-input v-model="paymentForm.wechatAppId" placeholder="例如：wx8888888888888888" />
                    </el-form-item>
                    <el-form-item label="微信商户号 MchID">
                      <el-input v-model="paymentForm.wechatMchId" placeholder="例如：1600000000" />
                    </el-form-item>
                  </template>
                </el-form>
              </div>
            </div>

            <!-- 模块 3: 支付宝收款设置 -->
            <div class="config-card">
              <div class="cc-header">
                <div class="cc-title">
                  <span class="cc-icon">🔵</span>
                  <span>支付宝通道设置</span>
                </div>
                <el-switch v-model="paymentForm.alipayEnabled" active-text="启用" inactive-text="关闭" />
              </div>
              <div class="cc-body">
                <el-form label-width="140px" class="inner-form">
                  <el-form-item label="支付模式">
                    <el-radio-group v-model="paymentForm.alipayType">
                      <el-radio value="qr_code">个人/商户支付宝收款二维码 (扫码转账)</el-radio>
                      <el-radio value="face">支付宝官方当面付 / 网页支付直连</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <el-form-item v-if="paymentForm.alipayType === 'qr_code'" label="支付宝收款码URL">
                    <el-input v-model="paymentForm.alipayQr" placeholder="请输入支付宝收款二维码图片地址" />
                    <div v-if="paymentForm.alipayQr" class="qr-preview-box">
                      <img :src="paymentForm.alipayQr" alt="支付宝收款码预览" class="qr-preview-img" />
                    </div>
                  </el-form-item>

                  <template v-if="paymentForm.alipayType === 'face'">
                    <el-form-item label="支付宝 AppID">
                      <el-input v-model="paymentForm.alipayAppId" placeholder="例如：2021000000000000" />
                    </el-form-item>
                  </template>
                </el-form>
              </div>
            </div>

            <!-- 模块 4: 卡密兑换与收银台说明 -->
            <div class="config-card">
              <div class="cc-header">
                <div class="cc-title">
                  <span class="cc-icon">🔑</span>
                  <span>卡密兑换与收银台说明设置</span>
                </div>
                <el-switch v-model="paymentForm.cardEnabled" active-text="启用卡密" inactive-text="关闭" />
              </div>
              <div class="cc-body">
                <el-form label-width="140px" class="inner-form">
                  <el-form-item label="收银台温馨提示">
                    <el-input
                      v-model="paymentForm.noticeText"
                      type="textarea"
                      :rows="2"
                      placeholder="例如：如遇到充值疑问或支付问题，请联系官方客服微信协助处理。"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 底部保存按钮 -->
            <div class="payment-save-bar">
              <el-button type="primary" size="large" :loading="paymentSaveLoading" @click="handleSavePaymentConfig">
                💾 保存全部支付通道设置
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 5: 🎟️ VIP 卡密兑换码生成与管理 -->
        <el-tab-pane name="cards">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><Tickets /></el-icon>
              <span>VIP 兑换卡密管理</span>
            </span>
          </template>

          <div class="filter-toolbar">
            <div class="filter-inputs">
              <el-input
                v-model="cardQuery.keyword"
                placeholder="🔍 搜索卡密兑换码 / 备注..."
                prefix-icon="Search"
                clearable
                style="width: 260px"
                @keyup.enter="fetchVipCards"
              />
              <el-select
                v-model="cardQuery.type"
                placeholder="全部卡密类型"
                clearable
                style="width: 150px"
                @change="fetchVipCards"
              >
                <el-option label="全部类型" value="" />
                <el-option label="👑 永久尊享卡" value="lifetime" />
                <el-option label="📅 年卡" value="yearly" />
                <el-option label="⏱️ 季卡" value="quarterly" />
                <el-option label="⏱️ 月卡" value="monthly" />
              </el-select>
              <el-select
                v-model="cardQuery.used"
                placeholder="使用状态"
                clearable
                style="width: 130px"
                @change="fetchVipCards"
              >
                <el-option label="全部状态" value="" />
                <el-option label="未使用" value="false" />
                <el-option label="已兑换" value="true" />
              </el-select>
              <el-button type="primary" icon="Search" @click="fetchVipCards">查询</el-button>
            </div>
            <div class="filter-ops">
              <el-button type="success" icon="Plus" @click="handleOpenCardModal">批量生成卡密</el-button>
              <el-button icon="CopyDocument" @click="handleCopyAllUnusedCards">一键复制全部未使用卡密</el-button>
              <el-button icon="Refresh" @click="fetchVipCards">刷新</el-button>
            </div>
          </div>

          <el-table v-loading="cardsLoading" :data="cardList" class="custom-table" stripe border>
            <el-table-column label="卡密兑换码 (Code)" min-width="240">
              <template #default="{ row }">
                <div class="card-code-cell">
                  <span class="code-text">{{ row.code }}</span>
                  <el-button link type="primary" size="small" @click="copyText(row.code)">复制</el-button>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="对应套餐" width="160" align="center">
              <template #default="{ row }">
                <el-tag :type="getPlanTagType(row.type)" size="small">
                  {{ row.name }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="兑换状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.used" type="info" size="small">已兑换使用</el-tag>
                <el-tag v-else type="success" size="small">未使用 (有效)</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="使用人 / 兑换时间" min-width="200">
              <template #default="{ row }">
                <div v-if="row.used" class="card-used-info">
                  <div>用户ID: {{ row.usedBy }}</div>
                  <div class="t-sub">{{ row.usedAt }}</div>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>

            <el-table-column prop="remark" label="生成备注" min-width="150" />
            <el-table-column prop="createdAt" label="生成时间" width="170" align="center" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗 1：新增 / 编辑会员套餐 -->
    <el-dialog
      v-model="planDialogVisible"
      :title="isEditPlan ? `编辑套餐 [${planForm.name}]` : '新建会员套餐'"
      width="540px"
      destroy-on-close
    >
      <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-width="110px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="planForm.name" placeholder="例如：永久尊享会员 / 季卡会员" />
        </el-form-item>

        <el-form-item label="类型标识" prop="type">
          <el-select v-model="planForm.type" style="width: 100%" placeholder="选择类型标识">
            <el-option label="月卡 (monthly)" value="monthly" />
            <el-option label="季卡 (quarterly)" value="quarterly" />
            <el-option label="年卡 (yearly)" value="yearly" />
            <el-option label="永久会员 (lifetime)" value="lifetime" />
            <el-option label="自定义套餐 (custom)" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="售卖现价 (¥)" prop="price">
          <el-input-number
            v-model="planForm.price"
            :min="0.01"
            :max="99999"
            :precision="2"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="划线原价 (¥)">
          <el-input-number
            v-model="planForm.originalPrice"
            :min="0"
            :max="99999"
            :precision="2"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="有效天数" prop="duration">
          <el-input-number
            v-model="planForm.duration"
            :min="1"
            :max="99999"
            :step="30"
            style="width: 100%"
          />
          <div class="form-tip">💡 永久会员建议填 36500 天（100年）</div>
        </el-form-item>

        <el-form-item label="功能权益说明">
          <el-input
            v-model="planForm.featuresText"
            type="textarea"
            :rows="4"
            placeholder="每行输入一条特权说明，例如：&#10;解锁全科全部历年真题与题库&#10;AI 智能极速考点精解&#10;永久免费同步新考季真题"
          />
        </el-form-item>

        <el-form-item label="上架状态">
          <el-radio-group v-model="planForm.status">
            <el-radio :value="1">正常上架 (前台可见)</el-radio>
            <el-radio :value="0">暂时下架 (前台隐藏)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="planSubmitLoading" @click="handleSavePlan">
          确认保存套餐
        </el-button>
      </template>
    </el-dialog>

    <!-- 弹窗 2：手动开通 / 调整学员 VIP 权限 -->
    <el-dialog
      v-model="grantDialogVisible"
      :title="currentUserToGrant ? `调整学员 [${currentUserToGrant.username}] VIP 权益` : '手动为学员开通 VIP'"
      width="520px"
    >
      <el-form :model="grantForm" label-width="110px">
        <el-form-item v-if="!currentUserToGrant" label="目标学员" required>
          <el-input
            v-model="grantForm.targetUsername"
            placeholder="请输入需要开通 VIP 的用户名 / 手机号"
          />
        </el-form-item>

        <el-form-item label="选择开通等级" required>
          <el-radio-group v-model="grantForm.memberLevel" class="grant-radio-group">
            <el-radio value="lifetime">
              <span class="gr-label">👑 永久尊享会员 (终身有效)</span>
            </el-radio>
            <el-radio value="yearly">
              <span class="gr-label">📅 年卡会员 (365天)</span>
            </el-radio>
            <el-radio value="quarterly">
              <span class="gr-label">⏱️ 季卡会员 (90天)</span>
            </el-radio>
            <el-radio value="monthly">
              <span class="gr-label">⏱️ 月卡会员 (30天)</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="开通方式">
          <el-radio-group v-model="grantForm.grantMode">
            <el-radio value="plan">按套餐默认时长开通</el-radio>
            <el-radio value="custom">自定义到期时间</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="grantForm.grantMode === 'custom'" label="指定到期时间">
          <el-date-picker
            v-model="grantForm.customExpireAt"
            type="datetime"
            placeholder="选择到期日期时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="grantDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="grantSubmitLoading" @click="handleConfirmGrant">
          确认开通 / 变更
        </el-button>
      </template>
    </el-dialog>

    <!-- 弹窗 3：批量生成 VIP 卡密 -->
    <el-dialog
      v-model="cardDialogVisible"
      title="🎟️ 批量生成 VIP 兑换卡密"
      width="480px"
    >
      <el-form :model="cardForm" label-width="100px">
        <el-form-item label="套餐类型" required>
          <el-select v-model="cardForm.type" style="width: 100%">
            <el-option label="👑 永久尊享会员 (终身买断)" value="lifetime" />
            <el-option label="📅 年卡会员 (365天)" value="yearly" />
            <el-option label="⏱️ 季卡会员 (90天)" value="quarterly" />
            <el-option label="⏱️ 月卡会员 (30天)" value="monthly" />
          </el-select>
        </el-form-item>

        <el-form-item label="生成数量" required>
          <el-input-number v-model="cardForm.count" :min="1" :max="100" :step="5" style="width: 100%" />
          <div class="form-tip">单次最多生成 100 张卡密</div>
        </el-form-item>

        <el-form-item label="生成备注">
          <el-input v-model="cardForm.remark" placeholder="例如：学员赠送 / 考季活动推广" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cardDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="cardSubmitLoading" @click="handleConfirmGenerateCards">
          立即生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Setting, User, Search, Refresh, RefreshRight, Document, Money, Tickets, CopyDocument } from '@element-plus/icons-vue'
import {
  getMemberPlans,
  createMemberPlan,
  updateMemberPlan,
  deleteMemberPlan,
  resetDefaultMemberPlans,
  getVipUserList,
  getVipStats,
  updateMember,
  type MemberPlanItem,
  type VipStats,
} from '@/api/user'
import {
  getAdminOrders,
  activateAdminOrder,
  refundAdminOrder,
  getAdminPaymentConfig,
  updateAdminPaymentConfig,
  getAdminVipCards,
  generateAdminVipCards,
  type OrderItem,
  type OrderStats,
  type PaymentConfig,
  type VipCardItem,
} from '@/api/system'

// 状态定义
const activeTab = ref('plans')
const plansLoading = ref(false)
const usersLoading = ref(false)
const ordersLoading = ref(false)
const paymentLoading = ref(false)
const cardsLoading = ref(false)
const planSubmitLoading = ref(false)
const grantSubmitLoading = ref(false)
const paymentSaveLoading = ref(false)
const cardSubmitLoading = ref(false)

const planList = ref<MemberPlanItem[]>([])
const vipUserList = ref<any[]>([])
const vipUsersTotal = ref(0)
const orderList = ref<OrderItem[]>([])
const ordersTotal = ref(0)
const cardList = ref<VipCardItem[]>([])

const stats = reactive<VipStats>({
  totalVipCount: 0,
  lifetimeCount: 0,
  yearlyCount: 0,
  quarterlyCount: 0,
  monthlyCount: 0,
  planCount: 0,
})

const orderStats = reactive<OrderStats>({
  totalRevenue: 0,
  todayRevenue: 0,
  paidCount: 0,
  pendingCount: 0,
  refundedCount: 0,
  totalOrders: 0,
})

// 查询对象
const userQuery = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  vipLevel: '',
})

const orderQuery = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  payStatus: '',
  payMethod: '',
})

const cardQuery = reactive({
  type: '',
  used: '',
  keyword: '',
})

// 支付配置表单
const paymentForm = reactive<PaymentConfig>({
  sandboxEnabled: true,
  wechatEnabled: true,
  wechatType: 'qr_code',
  wechatAppId: '',
  wechatMchId: '',
  wechatQr: '',
  alipayEnabled: true,
  alipayType: 'qr_code',
  alipayAppId: '',
  alipayQr: '',
  cardEnabled: true,
  noticeText: '如遇到充值疑问或支付问题，请联系官方客服微信协助处理。',
})

// 套餐弹窗表单
const planDialogVisible = ref(false)
const isEditPlan = ref(false)
const planFormRef = ref()
const planForm = reactive({
  id: 0,
  name: '',
  type: 'monthly',
  price: 6,
  originalPrice: 19,
  duration: 30,
  featuresText: '',
  status: 1,
})

const planRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择套餐类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入有效天数', trigger: 'blur' }],
}

// 手动开通弹窗
const grantDialogVisible = ref(false)
const currentUserToGrant = ref<any>(null)
const grantForm = reactive({
  targetUsername: '',
  memberLevel: 'lifetime',
  grantMode: 'plan',
  customExpireAt: '',
})

// 卡密生成弹窗
const cardDialogVisible = ref(false)
const cardForm = reactive({
  type: 'monthly',
  count: 10,
  remark: '',
})

function handleTabChange(tabName: any) {
  if (tabName === 'plans') fetchPlans()
  if (tabName === 'users') fetchVipUsers()
  if (tabName === 'orders') fetchOrders()
  if (tabName === 'payment') fetchPaymentConfig()
  if (tabName === 'cards') fetchVipCards()
}

// ==================== 1. 会员套餐 ====================

async function fetchPlans() {
  plansLoading.value = true
  try {
    const res = await getMemberPlans()
    planList.value = res.data || []
  } catch (err: any) {
    ElMessage.error(err?.message || '获取套餐列表失败')
  } finally {
    plansLoading.value = false
  }
}

function handleAddPlan() {
  isEditPlan.value = false
  planForm.id = 0
  planForm.name = ''
  planForm.type = 'monthly'
  planForm.price = 6
  planForm.originalPrice = 19
  planForm.duration = 30
  planForm.featuresText = '解锁全部题目\nAI智能解析\n错题本无上限\n艾宾浩斯智能复习'
  planForm.status = 1
  planDialogVisible.value = true
}

function handleEditPlan(row: MemberPlanItem) {
  isEditPlan.value = true
  planForm.id = row.id
  planForm.name = row.name
  planForm.type = row.type
  planForm.price = Number(row.price)
  planForm.originalPrice = row.originalPrice ? Number(row.originalPrice) : 0
  planForm.duration = row.duration
  planForm.featuresText = Array.isArray(row.features) ? row.features.join('\n') : ''
  planForm.status = row.status
  planDialogVisible.value = true
}

async function handleSavePlan() {
  if (!planFormRef.value) return
  await planFormRef.value.validate()

  planSubmitLoading.value = true
  try {
    const features = planForm.featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      name: planForm.name,
      type: planForm.type,
      price: planForm.price,
      originalPrice: planForm.originalPrice || undefined,
      duration: planForm.duration,
      features,
      status: planForm.status,
    }

    if (isEditPlan.value) {
      await updateMemberPlan(planForm.id, payload)
      ElMessage.success('套餐更新成功')
    } else {
      await createMemberPlan(payload)
      ElMessage.success('套餐创建成功')
    }

    planDialogVisible.value = false
    fetchPlans()
  } catch (err: any) {
    ElMessage.error(err?.message || '保存套餐失败')
  } finally {
    planSubmitLoading.value = false
  }
}

async function handleTogglePlanStatus(row: MemberPlanItem, val: boolean) {
  try {
    await updateMemberPlan(row.id, { status: val ? 1 : 0 })
    row.status = val ? 1 : 0
    ElMessage.success(`套餐已${val ? '上架' : '下架'}`)
  } catch (err: any) {
    ElMessage.error(err?.message || '切换状态失败')
  }
}

async function handleDeletePlan(row: MemberPlanItem) {
  try {
    await ElMessageBox.confirm(`确定要删除套餐 [${row.name}] 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    })
    await deleteMemberPlan(row.id)
    ElMessage.success('套餐已删除')
    fetchPlans()
  } catch {
    // ignore
  }
}

async function handleResetDefaultPlans() {
  try {
    await ElMessageBox.confirm(
      '确定要重置为官方标准价格套餐吗？（月卡6元、季卡15元、年卡60元、永久会员68元）',
      '重置确认',
      { type: 'warning' },
    )
    await resetDefaultMemberPlans()
    ElMessage.success('已成功重置为标准默认价格！')
    fetchPlans()
  } catch {
    // ignore
  }
}

// ==================== 2. VIP 学员 ====================

async function fetchVipUsers() {
  usersLoading.value = true
  try {
    const res = await getVipUserList(userQuery)
    if (res?.data) {
      vipUserList.value = res.data.list || []
      vipUsersTotal.value = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '获取 VIP 学员失败')
  } finally {
    usersLoading.value = false
  }
}

function resetUserQuery() {
  userQuery.keyword = ''
  userQuery.vipLevel = ''
  userQuery.page = 1
  fetchVipUsers()
}

async function fetchStats() {
  try {
    const res = await getVipStats()
    if (res?.data) {
      Object.assign(stats, res.data)
    }
  } catch {
    // ignore
  }
}

function handleOpenGrantModal() {
  currentUserToGrant.value = null
  grantForm.targetUsername = ''
  grantForm.memberLevel = 'lifetime'
  grantForm.grantMode = 'plan'
  grantForm.customExpireAt = ''
  grantDialogVisible.value = true
}

function handleEditUserVip(user: any) {
  currentUserToGrant.value = user
  grantForm.targetUsername = user.username
  grantForm.memberLevel = user.isLifetime || user.vipLevel >= 4 ? 'lifetime' : user.vipLevel === 3 ? 'yearly' : user.vipLevel === 2 ? 'quarterly' : 'monthly'
  grantForm.grantMode = 'plan'
  grantForm.customExpireAt = user.vipExpireAt || ''
  grantDialogVisible.value = true
}

async function handleConfirmGrant() {
  grantSubmitLoading.value = true
  try {
    const targetUserId = currentUserToGrant.value?.id
    if (!targetUserId && !grantForm.targetUsername) {
      ElMessage.warning('请输入目标学员账号或手机号')
      return
    }

    const payload = {
      memberLevel: grantForm.memberLevel,
      expireAt: grantForm.grantMode === 'custom' ? grantForm.customExpireAt : undefined,
    }

    if (targetUserId) {
      await updateMember(targetUserId, payload)
      ElMessage.success('学员 VIP 权益调整成功')
    } else {
      const found = vipUserList.value.find((u) => u.username === grantForm.targetUsername || u.phone === grantForm.targetUsername)
      if (found) {
        await updateMember(found.id, payload)
        ElMessage.success('学员 VIP 权益开通成功')
      } else {
        ElMessage.info('已发送开通指令')
      }
    }

    grantDialogVisible.value = false
    fetchVipUsers()
    fetchStats()
  } catch (err: any) {
    ElMessage.error(err?.message || '开通/调整失败')
  } finally {
    grantSubmitLoading.value = false
  }
}

async function handleRevokeVip(user: any) {
  try {
    await ElMessageBox.confirm(`确定要取消学员 [${user.username}] 的 VIP 资格吗？`, '取消确认', {
      type: 'warning',
    })
    await updateMember(user.id, { memberLevel: 'none' })
    ElMessage.success('已取消该学员的 VIP 资格')
    fetchVipUsers()
    fetchStats()
  } catch {
    // ignore
  }
}

// 辅助函数
function getPlanEmoji(type: string) {
  switch (type) {
    case 'lifetime':
      return '👑'
    case 'yearly':
      return '📅'
    case 'quarterly':
      return '⏱️'
    case 'monthly':
      return '🌱'
    default:
      return '🏷️'
  }
}

function getPlanTagType(type: string) {
  switch (type) {
    case 'lifetime':
      return 'danger'
    case 'yearly':
      return 'warning'
    case 'quarterly':
      return 'primary'
    case 'monthly':
      return 'success'
    default:
      return 'info'
  }
}

function formatTime(val: string | null) {
  if (!val) return '永久有效'
  const d = new Date(val)
  if (isNaN(d.getTime()) || d.getFullYear() >= 2090) return '永久有效'
  return d.toLocaleString('zh-CN', { hour12: false })
}

// ==================== 3. 订单流水 ====================

async function fetchOrders() {
  ordersLoading.value = true
  try {
    const res = await getAdminOrders(orderQuery)
    if (res?.data) {
      orderList.value = res.data.list || []
      ordersTotal.value = res.data.total || 0
      if (res.data.stats) {
        Object.assign(orderStats, res.data.stats)
      }
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '获取订单列表失败')
  } finally {
    ordersLoading.value = false
  }
}

function resetOrderQuery() {
  orderQuery.keyword = ''
  orderQuery.payStatus = ''
  orderQuery.payMethod = ''
  orderQuery.page = 1
  fetchOrders()
}

async function handleManualActivateOrder(order: OrderItem) {
  try {
    await ElMessageBox.confirm(
      `确定手动核销订单 #${order.orderNo} 并为用户 [${order.username}] 立即开通 [${order.planName}] 吗？`,
      '手动核销确认',
      { type: 'warning' },
    )
    const res = await activateAdminOrder(order.id)
    ElMessage.success(res.data?.message || '订单已核销并成功激活 VIP！')
    fetchOrders()
    fetchVipUsers()
    fetchStats()
  } catch {
    // ignore
  }
}

async function handleRefundOrder(order: OrderItem) {
  try {
    await ElMessageBox.confirm(`确定对订单 #${order.orderNo} 进行退款处理吗？`, '退款确认', {
      type: 'warning',
    })
    const res = await refundAdminOrder(order.id)
    ElMessage.success(res.data?.message || '订单已标记退款')
    fetchOrders()
  } catch {
    // ignore
  }
}

// ==================== 4. 支付通道配置 ====================

async function fetchPaymentConfig() {
  paymentLoading.value = true
  try {
    const res = await getAdminPaymentConfig()
    if (res?.data) {
      Object.assign(paymentForm, res.data)
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '获取支付配置失败')
  } finally {
    paymentLoading.value = false
  }
}

async function handleSavePaymentConfig() {
  paymentSaveLoading.value = true
  try {
    await updateAdminPaymentConfig(paymentForm)
    ElMessage.success('🎉 支付通道与收款配置已成功保存并即时生效！')
  } catch (err: any) {
    ElMessage.error(err?.message || '保存支付配置失败')
  } finally {
    paymentSaveLoading.value = false
  }
}

// ==================== 5. 卡密管理 ====================

async function fetchVipCards() {
  cardsLoading.value = true
  try {
    const res = await getAdminVipCards(cardQuery)
    if (res?.data) {
      cardList.value = res.data.list || []
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '获取卡密列表失败')
  } finally {
    cardsLoading.value = false
  }
}

function handleOpenCardModal() {
  cardForm.type = 'monthly'
  cardForm.count = 10
  cardForm.remark = '官方活动批量生成'
  cardDialogVisible.value = true
}

async function handleConfirmGenerateCards() {
  cardSubmitLoading.value = true
  try {
    const res = await generateAdminVipCards(cardForm)
    ElMessage.success(res.data?.message || '卡密生成成功')
    cardDialogVisible.value = false
    activeTab.value = 'cards'
    fetchVipCards()
  } catch (err: any) {
    ElMessage.error(err?.message || '生成卡密失败')
  } finally {
    cardSubmitLoading.value = false
  }
}

function handleCopyAllUnusedCards() {
  const unused = cardList.value.filter((c) => !c.used).map((c) => `${c.code} (${c.name})`)
  if (unused.length === 0) {
    return ElMessage.warning('暂无未使用的卡密')
  }
  const text = unused.join('\n')
  copyText(text)
  ElMessage.success(`已复制 ${unused.length} 张未使用卡密至剪贴板！`)
}

// ==================== 工具函数 ====================

function copyText(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  }
}

onMounted(() => {
  fetchPlans()
  fetchVipUsers()
  fetchStats()
  fetchOrders()
})
</script>

<style scoped lang="scss">
.vip-manage-page {
  padding: 24px;
  background: var(--bg-page, #f8fafc);
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .subtitle {
    font-size: 13px;
    color: #64748b;
    margin: 4px 0 0 0;
  }

  .primary-btn {
    padding: 8px 18px;
    font-weight: 600;
  }
}

/* 统计卡片 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;

    &.bg-gold { background: #fef3c7; }
    &.bg-purple { background: #f5f3ff; }
    &.bg-blue { background: #e0f2fe; }
    &.bg-emerald { background: #ecfdf5; }
    &.bg-indigo { background: #eef2ff; }
  }

  .stat-info {
    .stat-num {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
  }
}

/* 主面板 */
.main-tabs-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
  overflow: hidden;
  padding: 16px 20px 24px;
}

.tab-label-custom {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

/* 工具栏 */
.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;

  .toolbar-left {
    .tool-tip {
      font-size: 13px;
      color: #64748b;
    }
  }

  .toolbar-right {
    display: flex;
    gap: 10px;
  }

  .filter-inputs {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* 表格单元格样式 */
.plan-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .p-emoji { font-size: 18px; }
  .p-title-box {
    display: flex;
    align-items: center;
    gap: 6px;

    .p-name {
      font-weight: 700;
      color: #0f172a;
    }

    .badge-lifetime {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 8px;
    }
  }
}

.price-highlight {
  font-weight: 800;
  font-size: 16px;
  color: #d97706;
}

.orig-price-text {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 13px;
}

.duration-lifetime {
  color: #dc2626;
  font-weight: 700;
}

.duration-days {
  color: #334155;
  font-weight: 600;
}

.features-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .f-tag {
    font-size: 11px;
    border-radius: 4px;
  }
}

/* 用户表格单元格 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .u-avatar {
    background: #6366f1;
    color: #fff;
    font-weight: 700;
  }

  .u-text {
    .u-name {
      font-weight: 700;
      color: #0f172a;
    }
    .u-nick {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
  }
}

.contact-cell {
  font-size: 12px;
  color: #334155;
  .phone { margin-bottom: 2px; }
  .email { color: #64748b; }
}

.vip-badge-lifetime {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.vip-badge-yearly {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.vip-badge-quarterly {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.vip-badge-monthly {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.expire-cell {
  font-size: 12px;
  .exp-lifetime {
    color: #dc2626;
    font-weight: 700;
  }
  .exp-date {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #334155;

    .days-pill {
      background: #fef3c7;
      color: #b45309;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 8px;
    }
  }
}

.ops-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.grant-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .gr-label {
    font-size: 13px;
    font-weight: 600;
  }
}

.order-no-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  .o-num {
    font-family: monospace;
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
  }
}

.order-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .ou-name {
    font-weight: 700;
    color: #0f172a;
  }
  .ou-phone {
    font-size: 11.5px;
    color: #64748b;
  }
}

.order-amount-text {
  font-size: 15px;
  font-weight: 800;
  color: #10b981;
}

.time-col {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
  .t-lbl {
    color: #94a3b8;
  }
}

/* 支付配置容器 */
.payment-config-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  padding: 10px 0;

  .config-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px 20px;

    .cc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .cc-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }
    }

    .cc-body {
      .cc-desc {
        font-size: 13.5px;
        color: #64748b;
        margin: 0;
        line-height: 1.6;
      }

      .inner-form {
        margin-top: 10px;
      }

      .qr-preview-box {
        margin-top: 10px;
        .qr-preview-img {
          width: 140px;
          height: 140px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          object-fit: contain;
          background: #ffffff;
        }
      }
    }
  }

  .payment-save-bar {
    text-align: center;
    padding-top: 10px;
  }
}

.card-code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  .code-text {
    font-family: monospace;
    font-weight: 700;
    font-size: 13.5px;
    color: #6366f1;
  }
}

.card-used-info {
  font-size: 12px;
  .t-sub {
    color: #94a3b8;
    font-size: 11px;
  }
}
</style>